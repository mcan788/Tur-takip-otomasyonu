import{j as e}from"./index-ChdAUNVU.js";import{e as x,r as n}from"./vendor-react-Ls41PvmS.js";import{A as r,S as c,M as h,d as m,U as g,e as f,f as y}from"./vendor-icons-SoPyrebR.js";const v=()=>{const{agencyUsername:o}=x(),[t,s]=n.useState(null),[a,l]=n.useState([]),[p,d]=n.useState(!0);return n.useEffect(()=>{setTimeout(()=>{s({name:"Mavi Tur Seyahat",logo:null,phone:"+90 555 123 4567",description:"Ege ve Akdeniz'in en seçkin turları ile hayallerinizdeki tatili yaşayın."}),l([{id:1,title:"Fethiye Ölüdeniz Tekne Turu",price:"750",region:"Fethiye",image:"https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",rating:4.8},{id:2,title:"Kapadokya Balon Turu",price:"4500",region:"Nevşehir",image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",rating:4.9},{id:3,title:"Antalya Düden Şelalesi Gezisi",price:"1200",region:"Antalya",image:"https://images.unsplash.com/photo-1540202404-a2f29016bb5d?auto=format&fit=crop&w=800&q=80",rating:4.7}]),d(!1)},1e3)},[o]),p?e.jsx("div",{style:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center",background:"#0f172a",color:"white"},children:"Yükleniyor..."}):e.jsxs("div",{style:{background:"#0f172a",color:"white",minHeight:"100vh",fontFamily:"'Outfit', sans-serif"},children:[e.jsxs("nav",{className:"public-navbar",style:{padding:"20px 5%",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"rgba(15, 23, 42, 0.9)",backdropFilter:"blur(10px)",zIndex:100},children:[e.jsx("h1",{style:{fontSize:"24px",fontWeight:"800",background:"linear-gradient(to right, #38bdf8, #818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},children:t==null?void 0:t.name}),e.jsxs("div",{style:{display:"flex",gap:"30px",fontSize:"14px",fontWeight:"500"},children:[e.jsx("a",{href:"#tours",style:{color:"white",textDecoration:"none"},children:"Turlar"}),e.jsx("a",{href:"#about",style:{color:"white",textDecoration:"none"},children:"Kurumsal"}),e.jsx("a",{href:"#contact",style:{color:"#38bdf8",textDecoration:"none",border:"1px solid #38bdf8",padding:"8px 20px",borderRadius:"25px"},children:"İletişim"})]})]}),e.jsxs("section",{className:"public-hero",style:{height:"70vh",position:"relative",display:"flex",alignItems:"center",padding:"0 5%",overflow:"hidden"},children:[e.jsxs("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",zIndex:-1},children:[e.jsx("img",{src:"https://images.unsplash.com/photo-1506929113614-b9b1095f3efb?auto=format&fit=crop&w=1600&q=80",style:{width:"100%",height:"100%",objectFit:"cover",opacity:.4},alt:"Hero"}),e.jsx("div",{style:{position:"absolute",bottom:0,left:0,width:"100%",height:"100%",background:"linear-gradient(to top, #0f172a, transparent)"}})]}),e.jsxs("div",{style:{maxWidth:"700px"},children:[e.jsx("span",{style:{background:"rgba(56, 189, 248, 0.2)",color:"#38bdf8",padding:"5px 15px",borderRadius:"20px",fontSize:"12px",fontWeight:"600",letterSpacing:"1px"},children:"DÜNYAYI KEŞFET"}),e.jsxs("h2",{style:{fontSize:"64px",fontWeight:"900",margin:"20px 0",lineHeight:"1.1"},children:["Unutulmaz Bir ",e.jsx("br",{}),e.jsx("span",{style:{color:"#38bdf8"},children:"Macera"})," Başlıyor"]}),e.jsx("p",{style:{fontSize:"18px",color:"#94a3b8",lineHeight:"1.6",marginBottom:"40px"},children:t==null?void 0:t.description}),e.jsxs("button",{style:{background:"#38bdf8",color:"#0f172a",padding:"15px 35px",borderRadius:"30px",fontSize:"16px",fontWeight:"700",border:"none",cursor:"pointer",display:"flex",alignItems:"center"},children:["Hemen Rezervasyon Yap ",e.jsx(r,{size:20,style:{marginLeft:"10px"}})]})]})]}),e.jsxs("section",{id:"tours",style:{padding:"80px 5%"},children:[e.jsxs("div",{className:"tours-title-row",style:{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"50px",flexWrap:"wrap",gap:"20px"},children:[e.jsxs("div",{children:[e.jsx("h3",{style:{fontSize:"32px",fontWeight:"800"},children:"Popüler Turlarımız"}),e.jsx("p",{style:{color:"#94a3b8",marginTop:"10px"},children:"Sizin için seçtiğimiz en iyi deneyimler."})]}),e.jsx("div",{className:"responsive-flex-row",children:["Hepsi","Ege","Akdeniz","Kapadokya"].map(i=>e.jsx("button",{style:{padding:"8px 20px",borderRadius:"20px",border:"1px solid #1e293b",background:i==="Hepsi"?"#1e293b":"transparent",color:"white",fontSize:"14px"},children:i},i))})]}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:"30px"},children:a.map(i=>e.jsxs("div",{className:"tour-card",style:{background:"#1e293b",borderRadius:"24px",overflow:"hidden",transition:"all 0.3s ease"},children:[e.jsxs("div",{style:{position:"relative",height:"240px"},children:[e.jsx("img",{src:i.image,alt:i.title,style:{width:"100%",height:"100%",objectFit:"cover"}}),e.jsxs("div",{style:{position:"absolute",top:"20px",right:"20px",background:"rgba(15, 23, 42, 0.8)",padding:"5px 12px",borderRadius:"15px",display:"flex",alignItems:"center",gap:"5px"},children:[e.jsx(c,{size:14,color:"#facc15",fill:"#facc15"}),e.jsx("span",{style:{fontSize:"13px",fontWeight:"600"},children:i.rating})]})]}),e.jsxs("div",{style:{padding:"25px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px",color:"#38bdf8",fontSize:"13px",fontWeight:"600",marginBottom:"10px"},children:[e.jsx(h,{size:14})," ",i.region]}),e.jsx("h4",{style:{fontSize:"20px",fontWeight:"700",marginBottom:"15px"},children:i.title}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"20px",borderTop:"1px solid rgba(255,255,255,0.05)"},children:[e.jsxs("div",{children:[e.jsx("span",{style:{fontSize:"12px",color:"#94a3b8"},children:"Kişi Başı"}),e.jsxs("p",{style:{fontSize:"24px",fontWeight:"800",color:"#22c55e"},children:["₺",i.price]})]}),e.jsx("button",{style:{background:"#38bdf8",color:"#0f172a",width:"45px",height:"45px",borderRadius:"50%",border:"none",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(r,{size:20})})]})]})]},i.id))})]}),e.jsx("section",{style:{padding:"60px 5%",background:"#1e293b"},children:e.jsxs("div",{className:"trust-grid responsive-grid-4",children:[e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx(m,{size:32,color:"#38bdf8",style:{marginBottom:"15px"}}),e.jsx("h5",{style:{fontWeight:"700"},children:"Güvenli Ödeme"}),e.jsx("p",{style:{fontSize:"12px",color:"#94a3b8",marginTop:"5px"},children:"256-bit SSL koruması"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx(g,{size:32,color:"#38bdf8",style:{marginBottom:"15px"}}),e.jsx("h5",{style:{fontWeight:"700"},children:"Mutlu Müşteri"}),e.jsx("p",{style:{fontSize:"12px",color:"#94a3b8",marginTop:"5px"},children:"10.000+ Başarılı rezervasyon"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx(f,{size:32,color:"#38bdf8",style:{marginBottom:"15px"}}),e.jsx("h5",{style:{fontWeight:"700"},children:"Kolay İptal"}),e.jsx("p",{style:{fontSize:"12px",color:"#94a3b8",marginTop:"5px"},children:"Son 24 saate kadar iade"})]}),e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx(y,{size:32,color:"#38bdf8",style:{marginBottom:"15px"}}),e.jsx("h5",{style:{fontWeight:"700"},children:"7/24 Destek"}),e.jsx("p",{style:{fontSize:"12px",color:"#94a3b8",marginTop:"5px"},children:"Uzman ekibimiz yanınızda"})]})]})}),e.jsxs("footer",{style:{padding:"60px 5% 30px",borderTop:"1px solid rgba(255,255,255,0.05)"},children:[e.jsxs("div",{className:"public-footer-row",style:{display:"flex",justifyContent:"space-between",marginBottom:"40px"},children:[e.jsxs("div",{children:[e.jsx("h4",{style:{fontSize:"24px",fontWeight:"800",marginBottom:"20px"},children:t==null?void 0:t.name}),e.jsx("p",{style:{color:"#94a3b8",maxWidth:"300px",fontSize:"14px"},children:"Hayatınızın macerasına çıkmak için hazır mısınız?"})]}),e.jsxs("div",{className:"responsive-flex-row",children:[e.jsxs("div",{children:[e.jsx("h5",{style:{fontWeight:"700",marginBottom:"20px"},children:"Hızlı Bağlantılar"}),e.jsxs("ul",{style:{listStyle:"none",padding:0,fontSize:"14px",color:"#94a3b8"},children:[e.jsx("li",{style:{marginBottom:"10px"},children:"Turlar"}),e.jsx("li",{style:{marginBottom:"10px"},children:"Hakkımızda"}),e.jsx("li",{children:"SSS"})]})]}),e.jsxs("div",{children:[e.jsx("h5",{style:{fontWeight:"700",marginBottom:"20px"},children:"İletişim"}),e.jsx("p",{style:{fontSize:"14px",color:"#94a3b8"},children:t==null?void 0:t.phone}),e.jsx("p",{style:{fontSize:"14px",color:"#94a3b8",marginTop:"10px"},children:"info@zyronova.com"})]})]})]}),e.jsx("p",{style:{textAlign:"center",fontSize:"12px",color:"#475569",paddingTop:"30px",borderTop:"1px solid rgba(255,255,255,0.05)"},children:"© 2026 Zyronova tarafından güçlendirilmiştir."})]}),e.jsx("style",{children:`
        @media (max-width: 991px) {
          .trust-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 30px 20px !important;
          }
        }
        @media (max-width: 768px) {
          .public-navbar {
            flex-direction: column !important;
            gap: 15px !important;
            text-align: center !important;
          }
          .public-navbar div {
            gap: 20px !important;
          }
          .public-hero {
            height: auto !important;
            padding: 80px 20px !important;
            text-align: center !important;
          }
          .public-hero h2 {
            font-size: 38px !important;
          }
          .public-hero button {
            margin: 0 auto !important;
          }
          .tours-title-row {
            flex-direction: column !important;
            align-items: center !important;
            gap: 20px !important;
            text-align: center !important;
          }
          .tours-title-row div {
            justify-content: center !important;
          }
          .public-footer-row {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 30px !important;
          }
          .public-footer-row > div:nth-child(2) {
            flex-direction: column !important;
            gap: 30px !important;
          }
        }
        @media (max-width: 576px) {
          .trust-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `})]})};export{v as default};
