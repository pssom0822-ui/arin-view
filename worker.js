export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/news') return newsResponse();
    return env.ASSETS.fetch(request);
  }
};
const H={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=180, stale-while-revalidate=600','access-control-allow-origin':'*'};
function clean(s=''){return s.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/<[^>]+>/g,' ').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim()}
function dateKR(d){try{return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(d))}catch{return ''}}
async function getSBS(){
 const u='https://news.sbs.co.kr/news/ReplayRssFeed.do?prog_cd=R1&plink=RSSREADER';
 const r=await fetch(u,{headers:{'user-agent':'ARIN-View/1.1'}}); if(!r.ok) throw new Error('SBS '+r.status); const x=await r.text();
 const items=[...x.matchAll(/<item[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?(?:<pubDate>([\s\S]*?)<\/pubDate>)?[\s\S]*?<\/item>/gi)].slice(0,8).map(m=>({title:clean(m[1]),link:clean(m[2]),published:clean(m[3]||'')})).filter(x=>x.title&&x.link);
 return {items,date:items[0]?.published?dateKR(items[0].published):dateKR(Date.now()),source:u};
}
async function getMBC(){
 const urls=['https://imnews.imbc.com/replay/2026/nwdesk/index.html','https://imnews.imbc.com/m_main.html']; let html='',base='';
 for(const u of urls){try{const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0 ARIN-View/1.1'}});if(r.ok){html=await r.text();base=u;break}}catch{}}
 if(!html) throw new Error('MBC fetch failed');
 const seen=new Set(),items=[];
 const re=/<a[^>]+href=["']([^"']*(?:article|news)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
 while((m=re.exec(html))&&items.length<8){let title=clean(m[2]);if(title.length<8||title.length>140)continue;let link=new URL(m[1],base).href;if(seen.has(link))continue;seen.add(link);items.push({title,link});}
 return {items,date:dateKR(Date.now()),source:base};
}
async function newsResponse(){
 const out={updatedAt:new Date().toISOString(),sbs:null,mbc:null,errors:[]};
 const [s,m]=await Promise.allSettled([getSBS(),getMBC()]);
 if(s.status==='fulfilled')out.sbs=s.value;else out.errors.push('SBS');
 if(m.status==='fulfilled')out.mbc=m.value;else out.errors.push('MBC');
 return new Response(JSON.stringify(out),{status:(out.sbs||out.mbc)?200:502,headers:H});
}
