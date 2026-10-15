import BrandHome from '@/components/BrandHome';
import LocalizedNavLinks from '@/components/LocalizedNavLinks';
export default function Page() { return <main className="appShell"><header className="appTop card"><BrandHome /><LocalizedNavLinks /></header><section className="card" style={{padding:24,marginTop:18}}><h1 className="heroTitle">Store</h1><p className="heroSub">Coming after beta. For now, this stays minimal.</p></section></main>; }
