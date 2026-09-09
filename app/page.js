'use client';

import { useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { METRICS, DIMENSIONS, PROJECT_CONTEXT } from './metrics';

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
  {product:'Backpack',category:'Fashion',seller_tier:'MT',gmv:54000,orders:360},
];

function normalize(rows) {
  return rows.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [
    k.trim().toLowerCase().replace(/\s+/g,'_'),
    typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v.replace(/,/g,''))) ? Number(v.replace(/,/g,'')) : v
  ])));
}

function findMetric(question, data) {
  const q = question.toLowerCase();
  for (const [key, metric] of Object.entries(METRICS)) {
    if (metric.aliases.some(a => q.includes(a))) return key;
  }
  if (data.some(r => typeof r.gmv === 'number')) return 'gmv';
  return Object.keys(data[0] || {}).find(k => typeof data[0]?.[k] === 'number') || 'gmv';
}

function findDimension(question, data) {
  const q = question.toLowerCase();
  for (const [key, dim] of Object.entries(DIMENSIONS)) {
    if (dim.aliases.some(a => q.includes(a))) return key;
  }
  if (/tier|seller|lt|mt|st/.test(q) && data.some(r => r.seller_tier != null)) return 'seller_tier';
  if (/category|ngành/.test(q) && data.some(r => r.category != null)) return 'category';
  return data.some(r => r.product != null) ? 'product' : Object.keys(data[0] || {})[0];
}

function aggregate(data, dimension, metric) {
  const groups = {};
  data.forEach(r => {
    const name = r[dimension] ?? 'Unknown';
    groups[name] = (groups[name] || 0) + (Number(r[metric]) || 0);
  });
  return Object.entries(groups).map(([name,value]) => ({name,value}));
}

function answer(question, rows) {
  const data = normalize(rows);
  if (!data.length) return {type:'insight', text:'There is no data available yet.'};
  const q = question.toLowerCase();
  const metric = findMetric(question, data);
  const metricLabel = METRICS[metric]?.label || metric.toUpperCase();
  const dimension = findDimension(question, data);
  const dimensionLabel = DIMENSIONS[dimension]?.label || dimension;

  if (/why|tại sao|underperform|issue|problem|reason|nguyên nhân/.test(q)) {
    const chart = aggregate(data, dimension === 'product' ? 'seller_tier' : dimension, metric).sort((a,b)=>b.value-a.value);
    const low = chart.at(-1);
    return {
      type:'diagnostic', title:`Why is ${low?.name || 'this group'} underperforming?`, metric, dimension,
      text: `${low?.name || 'The lowest group'} has the lowest ${metricLabel} contribution (${formatValue(low?.value, metric)}). This identifies where the gap is; it does not by itself prove causality.`, chart,
    };
  }

  if (/compare|comparison|so sánh|versus|\bvs\b/.test(q)) {
    const chart = aggregate(data, dimension, metric).sort((a,b)=>b.value-a.value);
    return {type:'comparison', title:`${metricLabel} by ${dimensionLabel}`, metric, dimension, chart,
      text:`${chart[0]?.name || 'Top group'} leads with ${formatValue(chart[0]?.value, metric)}.`};
  }

  if (/top|highest|best|lowest|bottom|rank|xếp hạng|cao nhất|thấp nhất/.test(q)) {
    const chart = aggregate(data, dimension, metric).sort((a,b)=>b.value-a.value).slice(0,10);
    return {type:'ranking', title:`Top ${Math.min(10,chart.length)} ${dimensionLabel.toLowerCase()} by ${metricLabel}`, metric, dimension, chart};
  }

  if (/hot|bán chạy|best seller|popular|nổi bật/.test(q)) {
    const chart = aggregate(data, 'product', metric).sort((a,b)=>b.value-a.value);
    const best = chart[0];
    return {type:'insight', title:'Key insight', metric, dimension:'product',
      text:`${best?.name || 'No product'} is the strongest product by ${metricLabel}, at ${formatValue(best?.value, metric)}.`};
  }

  if (/total|tổng|how much|bao nhiêu/.test(q)) {
    const total = data.reduce((sum,r)=>sum+(Number(r[metric])||0),0);
    return {type:'insight', title:`Total ${metricLabel}`, metric, text:`Total ${metricLabel} across the connected dataset is ${formatValue(total, metric)}.`};
  }

  return {type:'insight', title:'I can analyze that', metric, text:`I recognized ${metricLabel} as the metric. Try asking me to rank, compare, explain why, or find the total. Example: “Top 10 products by GMV” or “Compare LT, MT and ST by orders”.`};
}

function formatValue(value, metric) {
  const n = Number(value || 0);
  return metric === 'gmv' || metric === 'aov' ? n.toLocaleString(undefined,{maximumFractionDigits:0}) : n.toLocaleString();
}

export default function Home() {
  const [rows,setRows] = useState(demo);
  const [input,setInput] = useState('');
  const [messages,setMessages] = useState([]);
  const [file,setFile] = useState('Demo dataset');
  const [project,setProject] = useState(PROJECT_CONTEXT.name);
  const [projects,setProjects] = useState(['Sales Performance','Marketing Dashboard']);
  const fileRef = useRef(null);
  const total = useMemo(()=>rows.reduce((a,r)=>a+(Number(r.gmv)||0),0),[rows]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    const result = answer(q, rows);
    setMessages(prev => [...prev,{role:'user',text:q},{role:'assistant',result}]);
    setInput('');
  };

  const upload = e => {
    const f=e.target.files?.[0]; if(!f)return;
    setFile(f.name);
    const reader=new FileReader();
    reader.onload=ev=>{
      const lines=String(ev.target.result).trim().split(/\r?\n/).filter(Boolean);
      if(lines.length<2)return;
      const split=line=>line.match(/(?:"([^"]*)")|([^,]+)/g)?.map(v=>v.replace(/^"|"$/g,'').trim()) || [];
      const headers=split(lines[0]);
      setRows(lines.slice(1).map(line=>{const vals=split(line);return Object.fromEntries(headers.map((h,i)=>[h,vals[i] ?? '']));}));
    };
    reader.readAsText(f);
  };

  const newProject = () => {
    const name = `New Project ${projects.length - 1}`;
    setProjects(p=>[...p,name]); setProject(name); setMessages([]); setRows(demo); setFile('Demo dataset');
  };

  return <main>
    <aside>
      <div className="brand"><span>✦</span> Analyst Copilot</div>
      <button className="new" onClick={newProject}>＋ New project</button>
      <div className="section">PROJECT</div>
      {projects.map(p=><button key={p} className={`project ${project===p?'active':''}`} onClick={()=>{setProject(p);setMessages([])}}><i/>{p}</button>)}
      <div className="section">DATA SOURCES</div>
      <label className="source">＋ Upload CSV<input ref={fileRef} type="file" accept=".csv" onChange={upload}/></label>
      <button className="source muted" onClick={()=>setMessages(prev=>[...prev,{role:'assistant',result:{type:'insight',title:'Google Sheets',text:'Google Sheets connector is the next integration. The semantic layer is already structured so columns can be mapped to defined metrics.'}}])}>◌ Google Sheets <small>soon</small></button>
      <button className="source muted" onClick={()=>setMessages(prev=>[...prev,{role:'assistant',result:{type:'insight',title:'Google Drive',text:'Google Drive connector is planned for the next data-source release.'}}])}>◌ Google Drive <small>soon</small></button>
      <button className="source muted" onClick={()=>fileRef.current?.click()}>◌ Excel <small>CSV MVP</small></button>
      <div className="schema"><div className="section">SEMANTIC LAYER</div><div className="schema-row"><b>Metrics</b><span>{Object.values(METRICS).map(m=>m.label).join(' · ')}</span></div><div className="schema-row"><b>Dimensions</b><span>{Object.values(DIMENSIONS).map(d=>d.label).join(' · ')}</span></div></div>
    </aside>

    <section className="content">
      <header><div><div className="eyebrow">{project.toUpperCase()}</div><h1>Ask your data.</h1><p>Natural language in. Structured analysis out.</p></div><div className="status"><span/> Data connected <b>{file}</b></div></header>
      <div className="cards"><div><small>ROWS</small><strong>{rows.length.toLocaleString()}</strong></div><div><small>GMV</small><strong>{total.toLocaleString()}</strong></div><div><small>METRICS</small><strong>{Object.keys(METRICS).length}</strong></div></div>

      <div className="chat">
        <div className="chat-scroll">
          {!messages.length && <div className="welcome"><div className="welcome-mark">✦</div><h2>What do you want to know?</h2><p>Ask in plain language. I’ll identify the metric, dimension and output needed.</p><div className="suggestions"><button onClick={()=>setInput('Top 10 products by GMV')}>Top 10 products by GMV</button><button onClick={()=>setInput('Compare seller tiers by orders')}>Compare seller tiers by orders</button><button onClick={()=>setInput('Why is LT underperforming?')}>Why is LT underperforming?</button></div></div>}
          {messages.map((m,i)=>m.role==='user'?<div className="message user" key={i}><div className="avatar user-avatar">You</div><div className="bubble">{m.text}</div></div>:<div className="message assistant" key={i}><div className="avatar">✦</div><div className="assistant-body"><div className="answer-label">ANALYST COPILOT</div><h2>{m.result.title}</h2>{m.result.text&&<p>{m.result.text}</p>}<Result result={m.result}/></div></div>)}
        </div>
        <div className="composer"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Ask anything about your data..."/><button onClick={send} disabled={!input.trim()}>Send <span>↗</span></button><div className="composer-hint">Enter to send · Shift + Enter for new line</div></div>
      </div>
    </section>
  </main>;
}

function Result({result:r}) {
  if (!r.chart) return null;
  return <div className="result-view">
    <div className="output-meta"><span>{r.type}</span><span>{METRICS[r.metric]?.label || r.metric}</span><span>{DIMENSIONS[r.dimension]?.label || r.dimension}</span></div>
    <div className="chart"><ResponsiveContainer width="100%" height={260}><BarChart data={r.chart} margin={{top:10,right:10,left:0,bottom:5}}><XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/><Tooltip formatter={v=>Number(v).toLocaleString()}/><Bar dataKey="value" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
    <div className="table-wrap"><table><thead><tr><th>#</th><th>{DIMENSIONS[r.dimension]?.label || 'Dimension'}</th><th>{METRICS[r.metric]?.label || 'Value'}</th></tr></thead><tbody>{r.chart.map((x,i)=><tr key={`${x.name}-${i}`}><td>{i+1}</td><td>{x.name}</td><td>{formatValue(x.value,r.metric)}</td></tr>)}</tbody></table></div>
  </div>;
}
