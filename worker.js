export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/news') return newsResponse();
    if (url.pathname === '/api/morning') return morningResponse();
    if (url.pathname === '/api/market') return marketResponse();
    return env.ASSETS.fetch(request);
  }
};
const H={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=180, stale-while-revalidate=900','access-control-allow-origin':'*'};
const UA={'user-agent':'ARIN-View/1.3 (+personal PWA)'};
function clean(s=''){return s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim()}
function dateKR(d){try{return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(d))}catch{return ''}}
async function getText(url, timeout=6500){const r=await fetch(url,{headers:UA,signal:AbortSignal.timeout(timeout)});if(!r.ok)throw new Error(`${url} ${r.status}`);return r.text()}
async function getSBS(){
 const u='https://news.sbs.co.kr/news/ReplayRssFeed.do?prog_cd=R1&plink=RSSREADER'; const x=await getText(u);
 const items=[...x.matchAll(/<item[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?(?:<pubDate>([\s\S]*?)<\/pubDate>)?[\s\S]*?<\/item>/gi)].slice(0,12).map(m=>({title:clean(m[1]),link:clean(m[2]),published:clean(m[3]||''),source:'SBS'})).filter(x=>x.title&&x.link);
 return {items,date:items[0]?.published?dateKR(items[0].published):dateKR(Date.now()),source:u};
}
async function getMBC(){
 const urls=['https://imnews.imbc.com/replay/2026/nwdesk/index.html','https://imnews.imbc.com/m_main.html']; let html='',base='';
 for(const u of urls){try{html=await getText(u);base=u;break}catch{}}
 if(!html) throw new Error('MBC fetch failed');
 const seen=new Set(),items=[]; const re=/<a[^>]+href=["']([^"']*(?:article|news)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
 while((m=re.exec(html))&&items.length<12){let title=clean(m[2]);if(title.length<8||title.length>140)continue;let link=new URL(m[1],base).href;if(seen.has(link))continue;seen.add(link);items.push({title,link,source:'MBC'});}
 return {items,date:dateKR(Date.now()),source:base};
}
async function newsData(){const out={updatedAt:new Date().toISOString(),sbs:null,mbc:null,errors:[]};const [s,m]=await Promise.allSettled([getSBS(),getMBC()]);if(s.status==='fulfilled')out.sbs=s.value;else out.errors.push('SBS');if(m.status==='fulfilled')out.mbc=m.value;else out.errors.push('MBC');return out}
async function newsResponse(){const out=await newsData();return new Response(JSON.stringify(out),{status:(out.sbs||out.mbc)?200:502,headers:H})}
function category(t=''){if(/반도체|AI|인공지능|엔비디아|마이크론|SK하이닉스|삼성전자|칩/.test(t))return '반도체·AI';if(/증시|주가|코스피|코스닥|나스닥|금리|환율|달러|경제|금융|관세|투자/.test(t))return '시장·경제';if(/미국|중국|일본|유럽|우크라이나|러시아|트럼프|정상|외교|전쟁/.test(t))return '국제';return '주요 뉴스'}
function normTitle(s=''){return s.toLowerCase().replace(/[^0-9a-z가-힣]/g,'').slice(0,70)}
async function morningResponse(){
 const d=await newsData();let pool=[...(d.sbs?.items||[]),...(d.mbc?.items||[])];const seen=new Set();pool=pool.filter(x=>{const k=normTitle(x.title);if(!k||seen.has(k))return false;seen.add(k);return true});
 const ranked=pool.map((x,i)=>({...x,category:category(x.title),score:(/반도체|AI|인공지능|증시|주가|코스피|코스닥|나스닥|금리|환율|달러|경제|금융|관세|투자|미국|중국|일본|유럽|우크라이나|러시아|트럼프/.test(x.title)?3:0)-i/100})).sort((a,b)=>b.score-a.score);
 const items=[];for(const x of ranked){if(items.length>=5)break;if(items.filter(y=>y.category===x.category).length>=2)continue;items.push({title:x.title,link:x.link,source:x.source,category:x.category})}for(const x of ranked){if(items.length>=5)break;if(!items.some(y=>y.link===x.link))items.push({title:x.title,link:x.link,source:x.source,category:x.category})}
 const out={updatedAt:new Date().toISOString(),date:d.sbs?.date||d.mbc?.date||dateKR(Date.now()),items,note:'핵심 5개 이내 · SBS/MBC 원문 기반 · 중복/카테고리 편중 억제',errors:d.errors};return new Response(JSON.stringify(out),{status:items.length?200:502,headers:H});
}
async function getECBUsdKrw(){
 const u='https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';const x=await getText(u);const time=(x.match(/time=['"]([^'"]+)/)||[])[1]||'';const usd=Number((x.match(/currency=['"]USD['"]\s+rate=['"]([^'"]+)/)||[])[1]);const krw=Number((x.match(/currency=['"]KRW['"]\s+rate=['"]([^'"]+)/)||[])[1]);if(!usd||!krw)throw new Error('ECB parse');return {value:krw/usd,date:time,source:'ECB',sourceUrl:u,label:'ECB 일일 참고환율'};
}
async function marketResponse(){
 const out={updatedAt:new Date().toISOString(),kospi:null,kosdaq:null,usdkrw:null,nasdaq:null,errors:[]};
 try{out.usdkrw=await getECBUsdKrw()}catch{out.errors.push('USD/KRW')}
 out.note='USD/KRW는 ECB 일일 참고환율 교차계산(EUR 기준 USD·KRW). KOSPI/KOSDAQ은 KRX 승인 전, NASDAQ은 적합한 데이터 라이선스 확보 전 숫자를 표시하지 않습니다.';
 return new Response(JSON.stringify(out),{status:out.usdkrw?200:206,headers:H});
}
