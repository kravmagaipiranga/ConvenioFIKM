async function check() {
  const htmlRes = await fetch('https://conveniosfikm.vercel.app');
  const html = await htmlRes.text();
  const match = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
  if (match) {
    const jsRes = await fetch('https://conveniosfikm.vercel.app' + match[1]);
    const js = await jsRes.text();
    console.log('Contains ErrorBoundary:', js.includes('Ops! Algo deu errado'));
    console.log('Contains persistentLocalCache:', js.includes('persistentLocalCache'));
  } else {
    console.log('No script tag found');
  }
}
check();
