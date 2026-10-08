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
 const items=[...x.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,24).map(m=>{const field=n=>clean((m[1].match(new RegExp('<'+n+'[^>]*>([\\s\\S]*?)<\\/'+n+'>','i'))||[])[1]||'');return {title:field('title'),link:field('link'),published:field('pubDate'),source:'SBS'}}).filter(x=>x.title&&/^https?:\/\//.test(x.link));
 return {items,date:items[0]?.published?dateKR(items[0].published):dateKR(Date.now()),source:u};
}
async function getMBC(){
 const urls=[`https://imnews.imbc.com/replay/${new Date().getUTCFullYear()}/nwdesk/index.html`,'https://imnews.imbc.com/m_main.html']; let html='',base='';
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
function importance(t){return /경보|긴급|사망|대피|지진|태풍|보안|유출|금리|관세|전쟁|폭등|폭락/.test(t)?5:/반도체|AI|인공지능|경제|환율|증시|외교/.test(t)?3:1}
function arinComment(t,c){if(/경보|대피|지진|태풍/.test(t))return '안전과 이동 계획에 영향을 줄 수 있어요. 해당 지역과 공식 안내부터 확인해요.';if(/보안|유출/.test(t))return '내 계정이나 금융 생활과 연결될 수 있어요. 적용 대상과 대응 안내를 확인해요.';if(c==='시장·경제')return '생활비와 시장 흐름에 이어질 수 있어요. 발표 내용과 적용 시점을 먼저 봐요.';if(c==='반도체·AI')return '기술과 산업 흐름의 변화를 살펴볼 소식이에요. 실제 발표 범위를 원문에서 확인해요.';if(c==='국제')return '국제 흐름이 국내에도 이어질 수 있어요. 확정된 사실과 향후 일정을 구분해 봐요.';return '오늘의 주요 흐름을 짧게 짚어볼 소식이에요. 제목 다음의 맥락은 원문에서 확인해요.'}
async function morningResponse(){
 const d=await newsData(),seen=new Set();const items=[...(d.sbs?.items||[]),...(d.mbc?.items||[])].filter(x=>{const k=normTitle(x.title);if(!k||seen.has(k)||!/^https?:\/\//.test(x.link))return false;seen.add(k);return true}).map((x,i)=>{const c=category(x.title);return {...x,category:c,importance:importance(x.title),sourceOrder:i,comment:arinComment(x.title,c)}});
 return new Response(JSON.stringify({updatedAt:d.updatedAt,date:d.sbs?.date||d.mbc?.date||dateKR(Date.now()),items,note:'방송사 원문 · 규칙 기반 선별/코멘트 · AI 요약 아님',errors:d.errors}),{status:items.length?200:502,headers:H});
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

