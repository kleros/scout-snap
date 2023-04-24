"use strict";(self.webpackChunksite=self.webpackChunksite||[]).push([[691],{381:function(e,t,r){r.r(t);var a=r(2784),n=r(2497),i=r(828),o=r(7155),d=r(1320),l=r(2322);const s=n.default.div.withConfig({displayName:"pages__Container",componentId:"sc-19qwndd-0"})(["display:flex;flex-direction:column;align-items:center;flex:1;margin-top:7.6rem;margin-bottom:7.6rem;","{padding-left:2.4rem;padding-right:2.4rem;margin-top:2rem;margin-bottom:2rem;width:auto;}"],(e=>{let{theme:t}=e;return t.mediaQueries.small})),m=n.default.h1.withConfig({displayName:"pages__Heading",componentId:"sc-19qwndd-1"})(["margin-top:0;margin-bottom:2.4rem;text-align:center;"]),c=n.default.span.withConfig({displayName:"pages__Span",componentId:"sc-19qwndd-2"})(["color:",";"],(e=>e.theme.colors.primary.default)),p=(n.default.p.withConfig({displayName:"pages__Subtitle",componentId:"sc-19qwndd-3"})(["font-size:",";font-weight:500;margin-top:0;margin-bottom:0;","{font-size:",";}"],(e=>{let{theme:t}=e;return t.fontSizes.large}),(e=>{let{theme:t}=e;return t.mediaQueries.small}),(e=>{let{theme:t}=e;return t.fontSizes.text})),n.default.div.withConfig({displayName:"pages__CardContainer",componentId:"sc-19qwndd-4"})(["display:flex;flex-direction:row;flex-wrap:wrap;justify-content:space-between;max-width:64.8rem;width:100%;height:100%;margin-top:1.5rem;"])),u=(n.default.div.withConfig({displayName:"pages__Notice",componentId:"sc-19qwndd-5"})(["background-color:",";border:1px solid ",";color:",";border-radius:",";padding:2.4rem;margin-top:2.4rem;max-width:60rem;width:100%;& > *{margin:0;}","{margin-top:1.2rem;padding:1.6rem;}"],(e=>{let{theme:t}=e;return t.colors.background.alternative}),(e=>{let{theme:t}=e;return t.colors.border.default}),(e=>{let{theme:t}=e;return t.colors.text.alternative}),(e=>{let{theme:t}=e;return t.radii.default}),(e=>{let{theme:t}=e;return t.mediaQueries.small})),n.default.div.withConfig({displayName:"pages__ErrorMessage",componentId:"sc-19qwndd-6"})(["background-color:",";border:1px solid ",";color:",";border-radius:",";padding:2.4rem;margin-bottom:2.4rem;margin-top:2.4rem;max-width:60rem;width:100%;","{padding:1.6rem;margin-bottom:1.2rem;margin-top:1.2rem;max-width:100%;}"],(e=>{let{theme:t}=e;return t.colors.error.muted}),(e=>{let{theme:t}=e;return t.colors.error.default}),(e=>{let{theme:t}=e;return t.colors.error.alternative}),(e=>{let{theme:t}=e;return t.radii.default}),(e=>{let{theme:t}=e;return t.mediaQueries.small})));t.default=()=>{const{0:e,1:t}=(0,a.useContext)(i.qR);return(0,l.jsxs)(s,{children:[(0,l.jsxs)(m,{children:["Welcome to ",(0,l.jsx)(c,{children:"Contract Insights Snap by Kleros"})]}),(0,l.jsxs)(p,{children:[e.error&&(0,l.jsxs)(u,{children:[(0,l.jsx)("b",{children:"An error happened:"})," ",e.error.message]}),!e.isFlask&&(0,l.jsx)(d.Zb,{content:{title:"Install",description:"Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.",button:(0,l.jsx)(d.zA,{})},fullWidth:!0}),(0,o.vP)(e.installedSnap)&&(0,l.jsx)(d.Zb,{content:{title:"Reconnect",description:"Click to update connect to Metamask Flask and update your Snap",button:(0,l.jsx)(d.V1,{onClick:async()=>{try{await(0,o.yN)();const e=await(0,o.kM)();t({type:i.H1.SetInstalled,payload:e})}catch(e){console.error(e),t({type:i.H1.SetError,payload:e})}},disabled:!e.installedSnap})},disabled:!e.installedSnap})]})]})}}}]);
//# sourceMappingURL=component---src-pages-index-tsx-b3329c1c59195ccc0268.js.map