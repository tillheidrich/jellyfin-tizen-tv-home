#!/usr/bin/env python3
"""
Patch a Jellyfin for Tizen package (Jellyfin.wgt) so the TV app loads the scripts from your server.

What it does
  1. injects <script src="https://YOUR-SERVER/JavaScriptInjector/public.js"> into www/index.html
     -> every script you mark as "public" in the JavaScript Injector plugin now also runs on the TV,
        and you can change it later on the server without reinstalling the app
  2. hides the stock splash logo (optional --name also changes the window title / app name)
  3. optionally adds the intro page from ../tizen-intro (animation + sound) in front of the app
  4. removes the old signature files – the package has to be signed again for your TV
     (Tizen Studio certificate, or a tool such as Jellyfin2Samsung that signs for you)

Usage
  python3 tools/patch-wgt.py Jellyfin.wgt Jellyfin-tvhome.wgt --server https://jellyfin.example.com
  python3 tools/patch-wgt.py Jellyfin.wgt MyFlix.wgt --server https://jellyfin.example.com \
          --name MyFlix --intro --wordmark MYFLIX --app-id MyFlix00001.MyFlix

Only the Python standard library is used.
"""
import argparse, os, re, sys, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
INTRO_DIR = os.path.join(HERE, '..', 'tizen-intro')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src', help='original Jellyfin.wgt (jellyfin-tizen build)')
    ap.add_argument('dst', help='patched output .wgt')
    ap.add_argument('--server', required=True, help='public base URL of your Jellyfin server, e.g. https://jellyfin.example.com')
    ap.add_argument('--name', help='app name shown on the TV (default: keep "Jellyfin")')
    ap.add_argument('--app-id', help='Tizen application id "PACKAGE.Name" (10-char package). Use a new one to install next to the stock app.')
    ap.add_argument('--intro', action='store_true', help='add the intro page (tizen-intro/index.html + intro.mp3)')
    ap.add_argument('--wordmark', default=None, help='text shown in the intro (default: --name or "JELLYFIN")')
    a = ap.parse_args()

    server = a.server.rstrip('/')
    if not re.match(r'^https?://', server):
        sys.exit('--server must start with http:// or https://')

    zin = zipfile.ZipFile(a.src)
    zout = zipfile.ZipFile(a.dst, 'w', zipfile.ZIP_DEFLATED)
    for info in zin.infolist():
        name = info.filename
        if name in ('author-signature.xml', 'signature1.xml'):
            continue  # must be re-signed
        data = zin.read(name)
        if name == 'www/index.html':
            html = data.decode('utf-8')
            tag = '<script defer src="%s/JavaScriptInjector/public.js"></script>' % server
            if 'JavaScriptInjector/public.js' not in html:
                html = html.replace('</body>', tag + '</body>')
            html = html.replace('</style>', '.splashLogo{display:none!important}html,body{background-color:#141414}</style>', 1)
            if a.name:
                html = re.sub(r'<title>.*?</title>', '<title>%s</title>' % a.name, html, count=1)
            data = html.encode('utf-8')
        elif name == 'config.xml':
            xml = data.decode('utf-8')
            if a.name:
                xml = re.sub(r'<name>.*?</name>', '<name>%s</name>' % a.name, xml, count=1)
            if a.app_id:
                pkg = a.app_id.split('.')[0]
                xml = re.sub(r'<tizen:application id="[^"]+" package="[^"]+"',
                             '<tizen:application id="%s" package="%s"' % (a.app_id, pkg), xml, count=1)
                xml = re.sub(r'(<widget[^>]*\sid=")[^"]+"', r'\g<1>http://localhost/%s"' % pkg, xml, count=1)
            data = xml.encode('utf-8')
        elif name == 'index.html' and a.intro:
            word = a.wordmark or (a.name or 'JELLYFIN').upper()
            data = open(os.path.join(INTRO_DIR, 'index.html'), encoding='utf-8').read().replace('WORDMARK', word).encode('utf-8')
        zout.writestr(info, data)
    if a.intro:
        zout.write(os.path.join(INTRO_DIR, 'intro.mp3'), 'intro.mp3')
    zout.close()
    print('written', a.dst, '- now sign and install it (see README, step 4)')


if __name__ == '__main__':
    main()
