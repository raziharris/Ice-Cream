set -euo pipefail
STAMP=$(date +%Y%m%d%H%M%S)
APP=/var/www/aiscreme-app
BACKUP=/var/backups/aiscreme-calendar-$STAMP
CONFIG=/etc/nginx/sites-available/icecream
NODE=/home/ubuntu/.nvm/versions/node/v24.18.0/bin/node
URLS=(http://127.0.0.1/TodoList/ http://127.0.0.1/uptime/ http://127.0.0.1/Travelly/ http://127.0.0.1/ProjectSell/ http://127.0.0.1/CTFLPractise/ http://127.0.0.1/Cariasec/ https://43-156-11-241.sslip.io/tracker/ https://43-156-11-241.sslip.io/PostKatThread/api/health)
check_routes(){ for url in "${URLS[@]}"; do code=$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "$url"); echo "PROTECTED $code $url"; [ "$code" = 200 ] || return 1; done; }
check_routes
sudo mkdir -p "$BACKUP"
sudo cp "$CONFIG" "$BACKUP/nginx.conf"
if [ -d "$APP" ]; then sudo cp -a "$APP" "$BACKUP/app"; fi
if [ -f /etc/systemd/system/aiscreme.service ]; then sudo cp /etc/systemd/system/aiscreme.service "$BACKUP/service"; fi
rollback(){ code=$?; if [ "$code" != 0 ]; then sudo cp "$BACKUP/nginx.conf" "$CONFIG"; sudo nginx -t && sudo systemctl reload nginx; sudo systemctl stop aiscreme || true; if [ -d "$BACKUP/app" ]; then sudo mv "$APP" "$APP.failed-$STAMP"; sudo cp -a "$BACKUP/app" "$APP"; fi; if [ -f "$BACKUP/service" ]; then sudo cp "$BACKUP/service" /etc/systemd/system/aiscreme.service; sudo systemctl daemon-reload; sudo systemctl restart aiscreme; fi; echo "ROLLED_BACK $BACKUP"; fi; exit "$code"; }
trap rollback EXIT
sudo mkdir -p "$APP" /var/lib/aiscreme
sudo chown ubuntu:ubuntu "$APP" /var/lib/aiscreme
sudo chmod 700 /var/lib/aiscreme
if [ ! -f /var/lib/aiscreme/auth.json ]; then install -m 600 /tmp/aiscreme-auth.json /var/lib/aiscreme/auth.json; fi
rm -f /tmp/aiscreme-auth.json
tar -xzf /tmp/aiscreme-calendar.tar.gz -C "$APP"
sudo tee /etc/systemd/system/aiscreme.service >/dev/null <<'SERVICE'
[Unit]
Description=Aiscreme booking calendar
After=network.target
[Service]
User=ubuntu
WorkingDirectory=/var/www/aiscreme-app
ExecStart=/home/ubuntu/.nvm/versions/node/v24.18.0/bin/node server.mjs
Environment=PORT=4198
Environment=DATA_DIR=/var/lib/aiscreme
Environment=SECURE_COOKIE=1
Restart=on-failure
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/aiscreme
[Install]
WantedBy=multi-user.target
SERVICE
sudo systemctl daemon-reload
sudo systemctl enable aiscreme
sudo systemctl restart aiscreme
for attempt in $(seq 1 20); do if curl -fsS http://127.0.0.1:4198/Icecream/api/availability >/dev/null; then break; fi; sleep 1; done
sudo "$NODE" /tmp/aiscreme-nginx.mjs
sudo nginx -t
sudo systemctl reload nginx
sleep 2
curl -fsS https://43-156-11-241.sslip.io/Icecream/api/availability
curl -fsS https://43-156-11-241.sslip.io/Icecream/admin/ | grep -q 'Booking studio'
curl -fsSL http://43.156.11.241/Icecream/ | grep -q 'aiscreme-booking-7'
check_routes
trap - EXIT
echo "DEPLOY_OK BACKUP=$BACKUP"
