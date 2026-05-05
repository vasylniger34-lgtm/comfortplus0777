const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function check() {
  await ssh.connect({
    host: '5.252.155.147',
    username: 'root',
    password: 'os1mw7Xk7U6t3lG5'
  })

  console.log('--- UPTIME ---')
  console.log((await ssh.execCommand('uptime')).stdout)
  
  console.log('--- MEMORY ---')
  console.log((await ssh.execCommand('free -m')).stdout)

  console.log('--- NGINX SITES ---')
  console.log((await ssh.execCommand('ls -la /etc/nginx/sites-enabled/')).stdout)

  console.log('--- CPU LOAD ---')
  console.log((await ssh.execCommand('top -bn1 | head -n 5')).stdout)

  process.exit(0)
}

check().catch(err => {
  console.error(err)
  process.exit(1)
})
