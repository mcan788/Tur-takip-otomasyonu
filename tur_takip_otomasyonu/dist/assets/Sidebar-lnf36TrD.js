import{j as e}from"./index-C6U_KSPI.js";import{d as A,r as d,N as B}from"./vendor-react-Ls41PvmS.js";import{a as E}from"./api-dUDnKhoq.js";import{$ as u,E as O,F as x,a0 as L,U as m,R as f,a1 as M,X as y,a2 as D,m as j,a3 as _,a4 as U}from"./vendor-icons-SoPyrebR.js";const J=({type:c})=>{A();const[s,i]=d.useState(!1),[v,S]=d.useState(null),[g,z]=d.useState({name:"Acente Paneli",isBranch:!1});d.useEffect(()=>{const a=localStorage.getItem("agencyName")||"Acente Paneli",t=localStorage.getItem("isBranch"),n=localStorage.getItem("assignedOfficeId");z({name:a,isBranch:t==="true"||t==="1"||t===!0||n&&n!==""&&n!=="null"}),localStorage.getItem("role")==="PERSONEL"&&E.get("/auth/me").then(r=>{r.data&&r.data.permissions&&(localStorage.setItem("permissions",JSON.stringify(r.data.permissions)),S(r.data.permissions))}).catch(r=>console.error("Could not fetch latest perms:",r))},[]);const k=()=>{localStorage.clear(),window.location.href="/"},I=g.name,p=g.isBranch,w=localStorage.getItem("role")||"AGENCY",h=localStorage.getItem("username")||"",N=localStorage.getItem("fullName")||h;localStorage.getItem("token");const R=[{name:"Dashboard",icon:e.jsx(u,{size:20}),path:"/super-admin"},{name:"Acenteler",icon:e.jsx(m,{size:20}),path:"/super-admin/agencies"},{name:"Raporlar",icon:e.jsx(x,{size:20}),path:"/super-admin/reports"},{name:"Destek Talepleri",icon:e.jsx(f,{size:20}),path:"/super-admin/support"},{name:"Rent A Car SaaS",icon:e.jsx(U,{size:20}),path:"/sso-login"}];let l=null;try{if(l=JSON.parse(localStorage.getItem("permissions")||"null"),!l){const a=localStorage.getItem("token");if(a){const t=a.split(".")[1];if(t){const n=t.replace(/-/g,"+").replace(/_/g,"/"),b=decodeURIComponent(atob(n).split("").map(function(T){return"%"+("00"+T.charCodeAt(0).toString(16)).slice(-2)}).join("")),r=JSON.parse(b);r&&r.permissions&&(l=r.permissions,localStorage.setItem("permissions",JSON.stringify(l)))}}}}catch(a){console.error("Error parsing permissions:",a)}const o=a=>{if(w!=="PERSONEL")return!0;const t=v||l;return t?!!t[a]||String(t[a]).toLowerCase()==="true":!1},C=[{name:"Genel Bakış",icon:e.jsx(u,{size:20}),path:"/agency"},...o("manage_tours")||o("view_tours")?[{name:"Tur Tanımları",icon:e.jsx(O,{size:20}),path:"/agency/tour-management"}]:[],...o("manage_bookings")||o("view_tours")?[{name:"Tur Kayıtları",icon:e.jsx(x,{size:20}),path:"/agency/tours"}]:[],...!p&&o("manage_offices")?[{name:"Ofisler",icon:e.jsx(L,{size:20}),path:"/agency/offices"}]:[],...o("manage_personnel")?[{name:"Personeller",icon:e.jsx(m,{size:20}),path:"/agency/personnel"}]:[],...o("view_reports")?[{name:"Raporlar",icon:e.jsx(x,{size:20}),path:"/agency/reports"}]:[],{name:"Destek Talepleri",icon:e.jsx(f,{size:20}),path:"/agency/support"},{name:"Profil & Ayarlar",icon:e.jsx(M,{size:20}),path:"/agency/profile"}],P=c==="super"?R:C;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        .mobile-header-bar {
          display: none;
        }
        .sidebar-container {
          width: 260px;
          min-width: 260px;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          padding: 20px;
          z-index: 100;
          background: var(--secondary-bg);
          border-right: 1px solid var(--border-color);
          flex-shrink: 0;
          overflow-y: auto;
          /* GPU compositor — left yerine transform kullan */
          will-change: transform;
          transform: translateX(0);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mobile-close-btn { display: none; }

        @media (max-width: 768px) {
          .mobile-header-bar {
            display: flex !important;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 56px;
            background: var(--secondary-bg);
            border-bottom: 1px solid var(--border-color);
            padding: 0 16px;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .sidebar-container {
            position: fixed !important;
            top: 0;
            left: 0 !important;
            height: 100vh;
            width: 260px !important;
            z-index: 1200;
            padding-top: 16px;
            overflow-y: auto;
            /* left yerine transform: daha hızlı, GPU'da */
            transform: translateX(-280px);
            will-change: transform;
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                        box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }
          .sidebar-container.mobile-open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          }
          .mobile-close-btn {
            display: flex !important;
            justify-content: flex-end;
            margin-bottom: 10px;
          }
          .main-content-area {
            padding-top: 56px !important;
          }
        }
      `}),e.jsxs("div",{className:"mobile-header-bar",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px"},children:[e.jsx("div",{style:{width:"10px",height:"10px",border:"2px solid var(--accent-color)",transform:"rotate(45deg)",borderRadius:"2px"}}),e.jsxs("span",{style:{fontSize:"15px",fontWeight:"800",color:"var(--text-main)",letterSpacing:"1px",textTransform:"uppercase"},children:["Zyronova ",e.jsx("span",{style:{color:"var(--accent-color)"},children:"SaaS"})]})]}),e.jsx("button",{onClick:()=>i(!s),"aria-label":s?"Menüyü kapat":"Menüyü aç",style:{background:"transparent",border:"none",color:"var(--text-main)",cursor:"pointer",padding:"8px",display:"flex",alignItems:"center"},children:s?e.jsx(y,{size:24}):e.jsx(D,{size:24})})]}),s&&e.jsx("div",{onClick:()=>i(!1),style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1100}}),e.jsxs("div",{className:`sidebar-container sidebar ${s?"mobile-open":""}`,children:[e.jsx("div",{className:"mobile-close-btn",children:e.jsx("button",{onClick:()=>i(!1),"aria-label":"Menüyü kapat",style:{background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer"},children:e.jsx(y,{size:20})})}),e.jsxs("div",{style:{marginBottom:"30px",textAlign:"center"},children:[e.jsx("h2",{style:{fontSize:"22px",fontWeight:"bold",color:"var(--text-main)",marginBottom:"5px"},children:"Zyronova SaaS"}),e.jsx("p",{style:{fontSize:"12px",color:"var(--text-muted)"},children:c==="super"?"Sistem Yönetim Merkezi":"Acente Yönetim Portalı"}),c==="agency"&&e.jsxs("div",{style:{marginTop:"15px",padding:"15px",borderRadius:"8px",border:"1px solid var(--border-color)",background:"#f8fafc"},children:[e.jsx("div",{style:{fontSize:"14px",fontWeight:"bold",color:"var(--text-main)",marginBottom:"8px"},children:I}),e.jsxs("div",{style:{fontSize:"13px",color:"var(--text-muted)",marginBottom:"10px",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"5px"},children:[e.jsx(m,{size:14})," ",e.jsx("span",{children:N})]}),e.jsxs("span",{children:["@",h]})]}),e.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:"6px",fontSize:"11px",background:p?"#e0e7ff":"#dcfce7",color:p?"#4338ca":"#166534",padding:"4px 10px",borderRadius:"6px",fontWeight:"bold"},children:[e.jsx(j,{size:12})," ",p?"ŞUBE PANELİ":"ANA OFİS"]})]}),c==="super"&&e.jsx("div",{style:{marginTop:"15px",padding:"15px",borderRadius:"8px",background:"#f1f5f9",border:"1px solid var(--border-color)"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",fontSize:"14px",fontWeight:"bold",color:"#334155"},children:[e.jsx(j,{size:16})," SÜPER ADMİN"]})})]}),e.jsx("nav",{style:{flex:1},children:P.map((a,t)=>a.external?e.jsxs("a",{href:a.path,style:{display:"flex",alignItems:"center",padding:"12px 15px",color:"var(--text-main)",textDecoration:"none",borderRadius:"12px",marginBottom:"8px",background:"transparent",transition:"background-color 0.12s cubic-bezier(0.4,0,0.2,1), color 0.12s cubic-bezier(0.4,0,0.2,1)",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"},onMouseEnter:n=>n.currentTarget.style.background="rgba(59,130,246,0.08)",onMouseLeave:n=>n.currentTarget.style.background="transparent",onClick:()=>i(!1),children:[e.jsx("span",{style:{marginRight:"12px",color:"var(--accent-color)"},children:a.icon}),a.name]},t):e.jsxs(B,{to:a.path,end:a.path==="/super-admin"||a.path==="/agency",style:({isActive:n})=>({display:"flex",alignItems:"center",padding:"12px 15px",color:n?"var(--accent-color)":"var(--text-main)",textDecoration:"none",borderRadius:"12px",marginBottom:"8px",background:n?"rgba(59,130,246,0.1)":"transparent",border:n?"1px solid rgba(59,130,246,0.15)":"1px solid transparent",transition:"background-color 0.12s cubic-bezier(0.4,0,0.2,1), color 0.12s cubic-bezier(0.4,0,0.2,1)",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}),onClick:()=>i(!1),children:[e.jsx("span",{style:{marginRight:"12px"},children:a.icon}),a.name]},t))}),e.jsx("div",{style:{borderTop:"1px solid var(--border-color)",paddingTop:"20px"},children:e.jsxs("button",{className:"btn",onClick:k,style:{display:"flex",alignItems:"center",color:"var(--error)",background:"transparent",width:"100%",padding:"12px",border:"none",cursor:"pointer"},children:[e.jsx(_,{size:20,style:{marginRight:"12px"}}),"Çıkış Yap"]})})]})]})};export{J as S};
