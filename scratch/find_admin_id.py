import urllib.request
import json
import time

token = '8615069227:AAEiCjdj66e469JqarZxWSlfzFQs1jGkr4M'
webhook_url = 'https://project-t0xw1.vercel.app/api/telegram'

def call_api(method, params=None):
    url = f'https://api.telegram.org/bot{token}/{method}'
    if params:
        data = json.dumps(params).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    else:
        req = urllib.request.Request(url)
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        return {'ok': False, 'error': str(e)}

print("Deleting webhook...")
print(call_api('deleteWebhook'))

print("Getting updates...")
updates = call_api('getUpdates')
print(json.dumps(updates, indent=2, ensure_ascii=False))

print("Restoring webhook...")
print(call_api('setWebhook', {'url': webhook_url}))
