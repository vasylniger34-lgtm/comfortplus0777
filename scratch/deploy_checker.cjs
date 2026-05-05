const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function deployChecker() {
  await ssh.connect({
    host: '5.252.155.147',
    username: 'root',
    password: 'os1mw7Xk7U6t3lG5'
  })

  const script = `
const domain = 'comfortplus0777.com.ua';
const targetIp = '5.252.155.147';
const botToken = '8775957832:AAGjNJGkcwIJ5EijphFv0wehxCfNd1UmP7A';
let chatId = null;

async function checkDns() {
  const dns = require('dns').promises;
  try {
    const addresses = await dns.resolve4(domain);
    console.log('Checked DNS:', addresses);
    if (addresses.includes(targetIp)) {
      await sendTelegram('✅ DNS для ' + domain + ' успішно оновилися! Сайт запрацював за адресою ' + targetIp + '.');
      process.exit(0);
    }
  } catch (e) {
    console.log('DNS Error:', e.message);
  }
}

async function sendTelegram(text) {
  if (!chatId) return;
  try {
    await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (e) {
    console.log('Telegram Error:', e.message);
  }
}

async function start() {
  console.log('Waiting for start message...');
  while (!chatId) {
    try {
      const res = await fetch('https://api.telegram.org/bot' + botToken + '/getUpdates?offset=-1').then(r => r.json());
      if (res.result && res.result.length > 0) {
        chatId = res.result[0].message.chat.id;
        console.log('Found chatId:', chatId);
      }
    } catch (e) {
      console.log('Update Error:', e.message);
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  
  await sendTelegram('🔔 Бот-чекер запущено! Я напишу вам сюди, як тільки DNS для comfortplus0777.com.ua оновляться.');
  
  setInterval(checkDns, 60000); 
}

start();
`

  await ssh.execCommand('cat <<EOF > /root/dns_checker.js\n' + script + '\nEOF')
  await ssh.execCommand('chmod +x /root/dns_checker.js')
  // Run in background and redirect output to log
  await ssh.execCommand('nohup node /root/dns_checker.js > /root/dns_checker.log 2>&1 &')
  
  console.log('DNS checker deployed and started in background.')
  process.exit(0)
}

deployChecker().catch(err => {
  console.error(err)
  process.exit(1)
})
