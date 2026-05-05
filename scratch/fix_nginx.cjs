const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function findDefault() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- SEARCHING FOR default_server ---')
    const grep = await ssh.execCommand('grep -r "default_server" /etc/nginx/sites-enabled/')
    console.log(grep.stdout)

    console.log('--- NGINX -T (Test config) ---')
    const test = await ssh.execCommand('nginx -t')
    console.log(test.stdout)
    console.log(test.stderr)

    console.log('--- RELOADING NGINX ---')
    const reload = await ssh.execCommand('systemctl reload nginx')
    console.log(reload.stdout)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

findDefault()
