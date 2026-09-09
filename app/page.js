'use client';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const demo = [
 {product:'Wireless Earbuds',category:'Electronics',seller_tier:'ST',gmv:128000,orders:640},
 {product:'Phone Case',category:'Electronics',seller_tier:'MT',gmv:92000,orders:1840},
 {product:'Running Shoes',category:'Fashion',seller_tier:'ST',gmv:115000,orders:575},
 {product:'T-Shirt',category:'Fashion',seller_tier:'LT',gmv:76000,orders:1520},
 {product:'Skincare Set',category:'Beauty',seller_tier:'MT',gmv:98000,orders:490},
 {product:'Sunscreen',category:'Beauty',seller_tier:'LT',gmv:61000,orders:610},
 {product:'Coffee Maker',category:'Home',seller_tier:'ST',gmv:87000,orders:290},
 {product:'Storage Box',category:'Home',seller_tier:'LT',gmv:43000,orders:860},
 {product:'Keyboard',category:'Electronics',seller_tier:'MT',gmv:69000,orders:460},
 {product:'Backpack',category:'Fashion',seller_tier:'MT',gmv:54000,orders:360}
];

function normalize(rows){ return rows.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k.trim().toLowerCase().replace(/\\s+/g,'_'), typeof v==='string' && !isNaN(Number(v.replace(/,/g,''))) ? Number(v.replace(/,/g,'')) : v]))); }
function analyze(q, rows){
 const s=q.toLowerCase(); const data=normalize(rows); const metric=data.some(r=>typeof r.gmv==='number')?'gmv':Object.keys(data[0]||{}).find(k=>typeof data[0][k]==='number');
 if(!data.length) return {type:'insight',title:'No data',text:'Upload a CSV or use the demo dataset.'};
 if(/why|tại sao|underperform|issue|problem/.test(s)){
  const key=data.some(r=>r.seller_tier!=null)?'seller_tier':data.some(r=>r.category!=null)?'category':Object.keys(data[0])[0];
  const groups={}; data.forEach(r=>{const g=r[key]??'Unknown';groups[g]=(groups[g]||0)+(Number(r[metric])||0)});
  const chart=Object.entries(groups).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const low=chart.at(-1); return {type:'diagnostic',title:'Diagnostic analysis',text:`${low.name} has the lowest ${metric.toUpperCase()} contribution among ${key.replace('_',' ')} groups. This is a performance signal, not proof of causality.`,chart};
 }
 if(/compare|comparison|so sánh|versus|vs\\.?/.test(s)){
  const key=data.some(r=>r.seller_tier!=null)?'seller_tier':data.some(r=>r.category!=null)?'category':Object.keys(data[0])[0]; const groups={}; data.forEach(r=>{const g=r[key]??'Unknown';groups[g]=(groups[g]||0)+(Number(r[metric])||0)}); const chart=Object.entries(groups).map(([name,value])=>({name,value})); return {type:'comparison',title:`${metric.toUpperCase()} comparison by ${key.replace('_',' ')}`,chart};
 }
 if(/top|highest|best|lowest|bottom|rank/.test(s)){
  const key=data.some(r=>r.product!=null)?'product':Object.keys(data[0])[0]; const chart=data.map(r=>({name:r[key],value:Number(r[metric])||0})).sort((a,b)=>b.value-a.value).slice(0,10); return {type:'ranking',title:`Top 10 by ${metric.toUpperCase()}`,chart};
 }
 if(/hot|bán chạy|best seller|popular/.test(s)){
  const key=data.some(r=>r.product!=null)?'product':Object.keys(data[0])[0]; const best=data.map(r=>r).sort((a,b)=>(Number(b[metric])||0)-(Number(a[metric])||0))[0]; return {type:'insight',title:'Key insight',text:`${best[key]} is the strongest item by ${metric.toUpperCase()} at ${Number(best[metric]).toLocaleString()}.`};
 }
 return {type:'insight',title:'Ask your data',text:'Try “Top 10 products by GMV”, “Compare seller tiers”, “What products are hot?”, or “Why is LT underperforming?”'};
}

export default function Home(){
 const [rows,setRows]=useState(demo); const [q,setQ]=useState(''); const [result,setResult]=useState(null); const [file,setFile]=useState('Demo dataset');
 const total=useMemo(()=>rows.reduce((a,r)=>a+(Number(r.gmv)||0),0),[rows]);
 const run=()=>setResult(analyze(q,rows));
 const upload=e=>{const f=e.target.files?.[0]; if(!f)return; setFile(f.name); const reader=new FileReader(); reader.onload=ev=>{const lines=String(ev.target.result).trim().split(/\\r?\\n/).map(x=>x.split(',').map(v=>v.replace(/^"|"$/g,''))); if(lines.length<2)return; const [h,...body]=lines; setRows(body.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]]))));}; reader.readAsText(f);};
 return <main><aside><div className="brand"><span>✦</span> Analyst Copilot</div><button className="new">＋ New project</button><div className="section">PROJECT</div><div className="project active"><i/> Sales Performance</div><div className="project"><i/> Marketing Dashboard</div><div className="section">DATA SOURCES</div><label className="source">＋ Upload CSV<input type="file" accept=".csv" onChange={upload}/></label><div className="source muted">◌ Google Sheets <small>soon</small></div><div className="source muted">◌ Google Drive <small>soon</small></div><div className="source muted">◌ Excel <small>soon</small></div></aside><section className="content"><header><div><div className="eyebrow">SALES PERFORMANCE</div><h1>What do you want to know?</h1><p>Ask a question. I’ll decide whether the answer needs a table, chart, insight, or diagnosis.</p></div><div className="status"><span/> Data connected <b>{file}</b></div></header><div className="cards"><div><small>ROWS</small><strong>{rows.length.toLocaleString()}</strong></div><div><small>GMV</small><strong>{total.toLocaleString()}</strong></div><div><small>AI MODE</small><strong>Copilot</strong></div></div><div className="ask"><textarea value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run()}}} placeholder="e.g. Why is LT underperforming?"/><button onClick={run}>Analyze <span>↗</span></button><div className="chips"><button onClick={()=>{setQ('Top 10 products by GMV');setResult(analyze('Top 10 products by GMV',rows))}}>Top 10</button><button onClick={()=>{setQ('Compare seller tiers');setResult(analyze('Compare seller tiers',rows))}}>Compare</button><button onClick={()=>{setQ('What products are hot?');setResult(analyze('What products are hot?',rows))}}>Hot products</button><button onClick={()=>{setQ('Why is LT underperforming?');setResult(analyze('Why is LT underperforming?',rows))}}>Why?</button></div></div>{result&&<Result result={result}/>} {!result&&<div className="empty"><div>✦</div><h2>Your data, conversationally.</h2><p>Upload a CSV or explore the demo dataset above.</p></div>}</section></main>
}
function Result({result:r}){return <div className="result"><div className="result-head"><div><div className="eyebrow">{r.type.toUpperCase()}</div><h2>{r.title}</h2></div><span className="pill">AI selected output</span></div>{r.text&&<p className="insight">{r.text}</p>}{r.chart&&<div className="chart"><ResponsiveContainer width="100%" height={300}><BarChart data={r.chart}><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip/><Bar dataKey="value" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>}{r.chart&&<table><thead><tr><th>Rank</th><th>Dimension</th><th>Value</th></tr></thead><tbody>{r.chart.map((x,i)=><tr key={x.name}><td>{i+1}</td><td>{x.name}</td><td>{Number(x.value).toLocaleString()}</td></tr>)}</tbody></table>}</div>}
