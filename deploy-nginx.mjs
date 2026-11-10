import fs from 'node:fs';
const file='/etc/nginx/sites-available/icecream';let s=fs.readFileSync(file,'utf8');
const start='    # AISCREME_ICECREAM_BEGIN',end='    # AISCREME_ICECREAM_END';
const a=s.indexOf(start),b=s.indexOf(end,a);if(a<0||b<0)throw Error('Managed route not found');
s=s.slice(0,a)+`${start}
    location = /Icecream { return 302 https://43-156-11-241.sslip.io/Icecream/; }
    location ^~ /Icecream/ { return 302 https://43-156-11-241.sslip.io$request_uri; }
${end}`+s.slice(b+end.length);
const marker='    server_name 43-156-11-241.sslip.io; # managed by Certbot';if(!s.includes(marker))throw Error('SSL host missing');
if(!s.includes('# AISCREME_BOOKING_HTTPS'))s=s.replace(marker,marker+`
    # AISCREME_BOOKING_HTTPS
    location = /Icecream { return 302 https://43-156-11-241.sslip.io/Icecream/; }
    location ^~ /Icecream/ {
        if ($scheme = http) { return 302 https://43-156-11-241.sslip.io$request_uri; }
        proxy_pass http://127.0.0.1:4198;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 16k;
    }
`);
fs.writeFileSync(file,s);
