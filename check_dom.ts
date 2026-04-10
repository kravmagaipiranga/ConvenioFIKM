import { JSDOM } from 'jsdom';

async function check() {
  const htmlRes = await fetch('https://conveniosfikm.vercel.app');
  const html = await htmlRes.text();
  const match = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
  if (match) {
    const jsUrl = 'https://conveniosfikm.vercel.app' + match[1];
    const jsRes = await fetch(jsUrl);
    const js = await jsRes.text();
    
    const dom = new JSDOM(html, {
      url: 'https://conveniosfikm.vercel.app',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    
    dom.window.onerror = function(msg, url, line, col, error) {
      console.log('JSDOM Error:', msg, error);
    };
    
    // Wait for scripts to load
    setTimeout(() => {
      console.log('Body HTML:', dom.window.document.body.innerHTML);
    }, 2000);
  }
}
check();
