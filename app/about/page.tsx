import BrandHome from '@/components/BrandHome';
import LocalizedNavLinks from '@/components/LocalizedNavLinks';
export default function Page() { return <main className="appShell"><header className="appTop card"><BrandHome /><LocalizedNavLinks /></header><section className="card" style={{padding:24,marginTop:18}}><h1 className="heroTitle">About UThynk</h1><p className="heroSub">UThynk helps teens and young adults practice thinking skills—reasoning, perspective, and judgment—without telling them what to believe.</p></section></main>; }
