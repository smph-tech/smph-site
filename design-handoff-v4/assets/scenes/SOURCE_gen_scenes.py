#!/usr/bin/env python3
# Builds 5 service illustration scenes (transparent bg) from real brand logos (simple-icons).
import json
ICONS = json.load(open('/home/claude/scenes/icons.json'))
NM = '/home/claude/r3d/node_modules/@fontsource'


def ic(name, size=52, color=None):
    i = ICONS[name]
    c = color or '#' + i['hex']
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" aria-label="{i["title"]}"><path fill="{c}" d="{i["path"]}"/></svg>'


def tile(name, x, y, rot=0, size=96, label=None, bg='#fff', color=None, delay=0):
    lab = label or ICONS[name]['title']
    return (f'<div class="tw" style="left:{x}px;top:{y}px;transform:rotate({rot}deg)">'
            f'<div class="tile" style="width:{size}px;height:{size}px;background:{bg}">{ic(name, int(size*.54), color)}</div>'
            f'<div class="cap">{lab}</div></div>')


CSS = f"""
@font-face{{font-family:'PJS';font-weight:500;src:url('file://{NM}/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff2')}}
@font-face{{font-family:'PJS';font-weight:700;src:url('file://{NM}/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2')}}
@font-face{{font-family:'PJS';font-weight:800;src:url('file://{NM}/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2')}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:transparent;width:1200px;height:900px;overflow:hidden;font-family:'PJS',sans-serif;color:#0B1230}}
.s{{position:relative;width:1200px;height:900px}}
.abs{{position:absolute}}
.tw{{position:absolute;display:flex;flex-direction:column;align-items:center;gap:10px}}
.tile{{border-radius:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 30px 44px -14px rgba(0,0,30,.5),0 2px 0 rgba(255,255,255,.9) inset,0 -5px 0 rgba(0,0,40,.07) inset}}
.cap{{font-weight:700;font-size:17px;color:#fff;text-shadow:0 2px 10px rgba(0,0,30,.45);white-space:nowrap}}
.win{{background:#fff;border-radius:26px;box-shadow:0 50px 80px -24px rgba(0,0,30,.55);overflow:hidden}}
.bar{{height:56px;background:#EEF1FB;display:flex;align-items:center;gap:9px;padding:0 22px}}
.dot{{width:13px;height:13px;border-radius:50%}}
.url{{margin-left:18px;flex:1;height:32px;border-radius:16px;background:#fff;display:flex;align-items:center;padding:0 16px;font-size:15px;font-weight:600;color:#6B7699}}
.sk{{height:14px;border-radius:7px;background:#DDE3F5}}
.sk.d{{background:#0B1230}}
.pill{{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:8px 16px;font-weight:700;font-size:15px}}
.card{{background:#fff;border-radius:22px;box-shadow:0 30px 50px -20px rgba(0,0,30,.5)}}
.glass{{background:rgba(255,255,255,.16);border:1.5px solid rgba(255,255,255,.4);border-radius:22px;backdrop-filter:blur(8px);color:#fff}}
.ck{{width:44px;height:44px;border-radius:50%;background:#16A34A;display:flex;align-items:center;justify-content:center;flex:none}}
"""

CK = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M5 11.5l4 4 8-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def web():
    days = ''.join(f'<div style="width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;{"background:#3B66F0;color:#fff;box-shadow:0 10px 18px -6px rgba(59,102,240,.8)" if d==14 else ("background:#EEF1FB;color:#33406F" if d not in (3,4) else "color:#B9C1DD")}">{d}</div>' for d in [1,2,3,4,10,11,12,13,14,15,16,17])
    return f'''
<div class="win abs" style="left:40px;top:90px;width:800px;height:590px">
 <div class="bar"><i class="dot" style="background:#FF5F57"></i><i class="dot" style="background:#FEBC2E"></i><i class="dot" style="background:#28C840"></i><div class="url">yourbusiness.com/book</div></div>
 <div style="padding:26px 34px">
  <div style="display:flex;align-items:center;gap:14px"><div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#FF7A2E,#F73F09)"></div><div class="sk" style="width:90px"></div><div style="flex:1"></div><div class="sk" style="width:60px"></div><div class="sk" style="width:60px"></div><div class="pill" style="background:#0B1230;color:#fff;padding:11px 20px">My bookings</div></div>
  <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:30px;margin-top:34px">
   <div><div class="sk d" style="width:92%;height:26px;border-radius:12px"></div><div class="sk d" style="width:70%;height:26px;border-radius:12px;margin-top:12px"></div>
    <div class="sk" style="width:95%;margin-top:22px"></div><div class="sk" style="width:80%;margin-top:10px"></div>
    <div style="margin-top:26px;display:flex;gap:12px"><div class="pill" style="background:linear-gradient(135deg,#4F7BFF,#7C4DFF);color:#fff;padding:14px 26px;font-size:16px">Book now</div><div class="pill" style="background:#EEF1FB;color:#33406F;padding:14px 22px;font-size:16px">View prices</div></div>
    <div style="display:flex;gap:12px;margin-top:30px">
     <div style="flex:1;height:96px;border-radius:18px;background:linear-gradient(135deg,#DDE6FF,#C9D6FF)"></div><div style="flex:1;height:96px;border-radius:18px;background:linear-gradient(135deg,#FFE3D1,#FFC9AA)"></div><div style="flex:1;height:96px;border-radius:18px;background:linear-gradient(135deg,#D8F5EA,#B7ECD7)"></div></div>
   </div>
   <div style="background:#F4F6FE;border-radius:22px;padding:22px 24px">
    <div style="display:flex;justify-content:space-between;font-weight:800;font-size:17px"><span>Pick a date</span><span style="color:#3B66F0">Nov</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px;justify-items:center">{days}</div>
    <div class="pill" style="width:100%;justify-content:center;margin-top:18px;background:#0B1230;color:#fff;padding:13px">Confirm booking</div>
   </div>
  </div>
 </div>
</div>
<div class="card abs" style="left:520px;top:600px;width:360px;display:flex;gap:16px;align-items:center;padding:22px 26px"><div class="ck">{CK}</div><div><div style="font-weight:800;font-size:19px">Payment received</div><div style="font-size:15px;color:#6B7699;font-weight:600;margin-top:2px">Receipt sent to the customer</div></div></div>
{tile('react',900,50,-6)}{tile('nextdotjs',1030,150,5)}{tile('typescript',890,250,4)}{tile('nodedotjs',1030,350,-5)}{tile('postgresql',890,450,6)}{tile('stripe',1030,550,-4)}{tile('tailwindcss',890,650,5)}
'''


def phone(x, y, rot, dark, body, w=330, h=660, z=1):
    bg = '#0E1530' if dark else '#fff'
    return (f'<div class="abs" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:56px;background:#0A0F24;padding:12px;transform:rotate({rot}deg);z-index:{z};box-shadow:0 60px 80px -30px rgba(0,0,30,.65),0 0 0 2px #2A3358 inset">'
            f'<div style="width:100%;height:100%;border-radius:46px;background:{bg};overflow:hidden;position:relative;color:{"#fff" if dark else "#0B1230"}">'
            f'<div style="position:absolute;left:50%;top:12px;width:92px;height:26px;border-radius:14px;background:#0A0F24;transform:translateX(-50%)"></div>{body}</div></div>')


def mobile():
    row = lambda c, t1, t2: f'<div style="display:flex;gap:14px;align-items:center;padding:12px 0"><div style="width:48px;height:48px;border-radius:15px;background:{c}"></div><div style="flex:1"><div style="font-weight:800;font-size:16px">{t1}</div><div style="font-size:13.5px;color:#7A86AD;font-weight:600">{t2}</div></div><div class="sk" style="width:34px"></div></div>'
    p1 = f'''<div style="padding:62px 24px 0"><div style="font-weight:800;font-size:25px;letter-spacing:-.02em">Good morning</div><div style="font-size:14px;color:#7A86AD;font-weight:600;margin-top:2px">Your next appointment</div>
<div style="margin-top:18px;border-radius:26px;padding:22px;background:linear-gradient(135deg,#10B981,#0B7A66);color:#fff;box-shadow:0 20px 30px -14px rgba(16,185,129,.8)"><div style="font-size:13px;font-weight:700;opacity:.85">TOMORROW</div><div style="font-weight:800;font-size:25px;margin-top:4px">10:30 AM</div><div style="display:inline-flex;margin-top:14px;background:rgba(255,255,255,.22);border-radius:999px;padding:7px 15px;font-weight:700;font-size:14px">Reschedule</div></div>
<div style="margin-top:18px">{row('linear-gradient(135deg,#FFD6B8,#FFB48A)','Orders','2 on the way')}{row('linear-gradient(135deg,#D3DCFF,#B6C5FF)','Offers','New for you')}{row('linear-gradient(135deg,#C9F3E2,#9BE6C9)','Support','We reply fast')}</div></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:78px;background:#fff;border-top:1px solid #E5E9F7;display:flex;justify-content:space-around;align-items:center"><i style="width:28px;height:28px;border-radius:9px;background:#10B981"></i><i style="width:28px;height:28px;border-radius:9px;background:#DDE3F5"></i><i style="width:28px;height:28px;border-radius:9px;background:#DDE3F5"></i></div>'''
    p2 = f'''<div style="padding:62px 22px 0"><div style="font-weight:800;font-size:23px">Order tracking</div>
<div style="margin-top:20px;display:flex;flex-direction:column;gap:0">
{''.join(f'<div style="display:flex;gap:14px;align-items:flex-start"><div style="display:flex;flex-direction:column;align-items:center"><div style="width:22px;height:22px;border-radius:50%;background:{"#34D399" if a else "#2E3A66"};display:flex;align-items:center;justify-content:center">{CK.replace("22","12") if a else ""}</div><div style="width:3px;height:44px;background:{"#34D399" if a else "#2E3A66"}"></div></div><div style="font-weight:700;font-size:16px;color:{"#fff" if a else "#7C89B8"};margin-top:-1px">{t}</div></div>' for t, a in [('Order placed', 1), ('Packed', 1), ('Out for delivery', 1), ('Delivered', 0)])}
</div></div>'''
    notif = f'<div class="card abs" style="left:300px;top:90px;width:380px;display:flex;gap:14px;align-items:center;padding:18px 22px;z-index:5"><div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#FF7A2E,#F73F09);flex:none"></div><div><div style="font-weight:800;font-size:17px">Order confirmed</div><div style="font-size:14px;color:#6B7699;font-weight:600">Your order is on its way</div></div></div>'
    return (
            phone(250, 150, -5, False, p1, z=2) + phone(520, 190, 6, True, p2, z=1) + notif +
            tile('flutter', 50, 120, -6) + tile('react', 50, 320, 5, label='React Native') + tile('firebase', 50, 520, -4) +
            tile('android', 930, 160, 5) + tile('apple', 930, 360, -5) + tile('kotlin', 930, 560, 4) + tile('swift', 60, 710, -3, size=80))


def systems():
    kpi = lambda c, t: f'<div style="flex:1;background:#F4F6FE;border-radius:18px;padding:16px 18px"><div style="width:30px;height:6px;border-radius:3px;background:{c}"></div><div style="font-weight:700;font-size:14px;color:#6B7699;margin-top:10px">{t}</div><svg width="100%" height="34" viewBox="0 0 120 34" style="margin-top:6px"><path d="M2 28 C20 26 28 14 46 18 S78 6 96 10 112 4 118 3" fill="none" stroke="{c}" stroke-width="3.5" stroke-linecap="round"/></svg></div>'
    bars = ''.join(f'<div style="width:34px;border-radius:9px 9px 4px 4px;height:{h}px;background:{c}"></div>' for h, c in [(60, '#FFC4A1'), (90, '#FFA46F'), (75, '#FFC4A1'), (120, '#FF7A2E'), (105, '#FFA46F'), (150, '#F73F09')])
    tr = lambda a, b, c, bg, fg: f'<div style="display:flex;align-items:center;gap:14px;padding:11px 0;border-top:1px solid #E8ECF8"><div style="width:34px;height:34px;border-radius:11px;background:#E9EDFB"></div><div class="sk" style="width:{a}px"></div><div style="flex:1"></div><div class="pill" style="background:{bg};color:{fg};padding:6px 14px;font-size:13.5px">{c}</div></div>'
    dash = f'''<div class="win abs" style="left:270px;top:100px;width:780px;height:650px;display:flex">
 <div style="width:78px;background:#1B1530;padding:26px 0;display:flex;flex-direction:column;align-items:center;gap:20px"><div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#FF7A2E,#F73F09)"></div>{''.join('<i style="width:28px;height:28px;border-radius:9px;background:#3A2F66"></i>' for _ in range(4))}</div>
 <div style="flex:1;padding:26px 30px">
  <div style="display:flex;align-items:center"><div style="font-weight:800;font-size:24px;letter-spacing:-.02em">Today at a glance</div><div style="flex:1"></div><div class="pill" style="background:#FFEBDD;color:#C2410C">Live</div></div>
  <div style="display:flex;gap:14px;margin-top:20px">{kpi('#F73F09','Orders')}{kpi('#16A34A','Stock')}{kpi('#7C4DFF','Payments')}</div>
  <div style="display:grid;grid-template-columns:.9fr 1.3fr;gap:18px;margin-top:18px">
   <div style="background:#F4F6FE;border-radius:18px;padding:18px;display:flex;align-items:flex-end;gap:12px;height:228px">{bars}</div>
   <div style="padding:4px 4px">{tr(120,0,'Paid','#DCFCE7','#15803D')}{tr(96,0,'Shipped','#DDE6FF','#3B66F0')}{tr(140,0,'Pending','#FFEBDD','#C2410C')}{tr(110,0,'Paid','#DCFCE7','#15803D')}</div>
  </div>
 </div></div>'''
    mess = f'''<div class="abs" style="left:46px;top:240px;width:200px;height:370px">
 <svg width="200" height="370" viewBox="0 0 200 370" style="position:absolute;left:0;top:0"><path d="M100 70 C150 120 200 150 250 175" fill="none" stroke="#fff" stroke-width="3.5" stroke-dasharray="3 10" stroke-linecap="round" opacity=".85"/><path d="M100 215 C150 205 200 195 250 182" fill="none" stroke="#fff" stroke-width="3.5" stroke-dasharray="3 10" stroke-linecap="round" opacity=".85"/><path d="M100 345 C160 300 210 230 252 190" fill="none" stroke="#fff" stroke-width="3.5" stroke-dasharray="3 10" stroke-linecap="round" opacity=".85"/></svg></div>
<div class="tw" style="left:30px;top:215px;transform:rotate(-5deg)"><div class="tile" style="width:96px;height:96px">{ic('googlesheets', 52)}</div><div class="cap">Spreadsheets</div></div>
<div class="tw" style="left:60px;top:365px;transform:rotate(4deg)"><div class="tile" style="width:96px;height:96px">{ic('whatsapp', 52)}</div><div class="cap">WhatsApp</div></div>
<div class="tw" style="left:36px;top:520px;transform:rotate(-3deg)"><div class="tile" style="width:96px;height:96px"><svg width="52" height="52" viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z" fill="#FBE8B4" stroke="#C9A24A" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 11h8M9 14.5h8M9 18h5" stroke="#B8903A" stroke-width="1.6" stroke-linecap="round"/></svg></div><div class="cap">Paper</div></div>'''
    return dash + mess + tile('postgresql', 300, 770, -3, size=84, label='PostgreSQL') + tile('python', 470, 780, 3, size=84) + tile('nodedotjs', 640, 770, -3, size=84, label='Node.js') + tile('mysql', 810, 780, 3, size=84, label='MySQL')


def marketing():
    serp = f'''<div class="card abs" style="left:50px;top:90px;width:700px;padding:26px 30px">
 <div style="display:flex;align-items:center;gap:16px;border:2px solid #E3E8FA;border-radius:999px;padding:12px 20px">{ic('google',30)}<div style="font-weight:700;font-size:18px;color:#33406F">best [your service] near me</div></div>
 <div style="margin-top:20px;border-left:6px solid #F73F09;background:#FFF6F0;border-radius:0 18px 18px 0;padding:18px 22px">
  <div style="display:flex;gap:10px;align-items:center"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#FF7A2E,#F73F09)"></div><div style="font-size:14px;color:#6B7699;font-weight:600">yourbusiness.com</div><div class="pill" style="background:#DCFCE7;color:#15803D;padding:3px 12px;font-size:12.5px;margin-left:auto">#1 result</div></div>
  <div style="font-weight:800;font-size:22px;color:#1A4BC8;margin-top:8px">Your Business: what customers are looking for</div>
  <div class="sk" style="width:94%;margin-top:12px"></div><div class="sk" style="width:70%;margin-top:9px"></div>
  <div style="display:flex;gap:10px;margin-top:16px"><div class="pill" style="background:#fff;border:2px solid #E3E8FA;color:#33406F;padding:8px 16px">Call</div><div class="pill" style="background:#fff;border:2px solid #E3E8FA;color:#33406F;padding:8px 16px">Directions</div><div class="pill" style="background:#fff;border:2px solid #E3E8FA;color:#33406F;padding:8px 16px">Message</div></div>
 </div>
 <div style="margin-top:18px;opacity:.5"><div class="sk" style="width:60%"></div><div class="sk" style="width:90%;margin-top:9px"></div></div>
</div>'''
    chart = f'''<div class="glass abs" style="left:50px;top:560px;width:430px;height:260px;padding:22px 26px">
 <div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:800;font-size:20px">Enquiries</div><div class="pill" style="background:#fff;color:#BE185D;padding:5px 14px;font-size:14px">&#8599; growing</div></div>
 <svg width="380" height="170" viewBox="0 0 380 170" style="margin-top:6px"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path d="M6 150 C60 140 80 118 120 122 S190 80 230 70 300 40 374 12 L374 168 L6 168Z" fill="url(#g)"/><path d="M6 150 C60 140 80 118 120 122 S190 80 230 70 300 40 374 12" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="374" cy="12" r="9" fill="#fff"/></svg></div>'''
    chat = f'''<div class="abs" style="left:520px;top:560px;width:330px">
 <div class="card" style="border-radius:22px 22px 22px 6px;padding:16px 20px;display:flex;gap:12px;align-items:center;width:300px"><div style="width:42px;height:42px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;flex:none">{ic('whatsapp',26,'#fff')}</div><div style="font-weight:700;font-size:16px;line-height:1.35">Hi, I found you on Google. Can you help?</div></div>
 <div style="margin:14px 0 0 40px;background:#DCF8C6;border-radius:22px 22px 6px 22px;padding:16px 20px;font-weight:700;font-size:16px;line-height:1.35;box-shadow:0 24px 36px -16px rgba(0,0,30,.5);width:290px;color:#14532D">Yes, tell us what you need.</div></div>'''
    return (serp + chart + chat + tile('google', 910, 60, -5) + tile('googleads', 1040, 160, 5, label='Google Ads') + tile('googleanalytics', 910, 260, 4, label='Analytics') + tile('instagram', 1040, 360, -5) +
            tile('meta', 910, 460, 5) + tile('youtube', 1040, 560, -4) + tile('whatsapp', 910, 660, 4) + tile('googlesearchconsole', 1040, 760, -3, size=80, label='Search Console'))


def consulting():
    node = lambda x, y, name, t1, t2, c: (f'<div class="card abs" style="left:{x}px;top:{y}px;width:290px;padding:20px 22px;display:flex;gap:16px;align-items:center"><div style="width:64px;height:64px;border-radius:20px;background:{c};display:flex;align-items:center;justify-content:center;flex:none">{ic(name, 36)}</div><div><div style="font-weight:800;font-size:19px">{t1}</div><div style="font-size:14.5px;color:#6B7699;font-weight:600;margin-top:2px">{t2}</div></div></div>')
    lines = '''<svg class="abs" style="left:0;top:0" width="1200" height="900" viewBox="0 0 1200 900"><defs><marker id="a" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="12" refY="8" orient="auto"><path d="M2 2l11 6-11 6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="none" style="stroke-dasharray:none"/></marker></defs>
<g fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" opacity=".95" marker-end="url(#a)">
<path d="M330 215 C420 215 440 300 520 330"/><path d="M810 330 C860 330 850 230 878 215"/><path d="M660 400 L660 470"/></g></svg>'''
    return (lines + node(40, 120, 'gmail', 'New enquiry', 'Arrives by email', '#FDECEA') + node(520, 255, 'googlesheets', 'Sheet updated', 'Added automatically', '#E6F6EA') +
            node(510, 470, 'whatsapp', 'Customer replied', 'Within seconds', '#E3F9EB') + node(880, 120, "telegram", 'Team notified', 'No one chases', '#E3F3FC') +
            f'<div class="glass abs" style="left:60px;top:545px;width:300px;padding:22px 26px"><div style="font-weight:800;font-size:20px">Runs by itself</div><div style="display:flex;gap:10px;align-items:center;margin-top:12px;font-weight:700;font-size:16px"><div class="ck" style="width:30px;height:30px">{CK.replace("22","16")}</div>No copy and paste</div><div style="display:flex;gap:10px;align-items:center;margin-top:10px;font-weight:700;font-size:16px"><div class="ck" style="width:30px;height:30px">{CK.replace("22","16")}</div>No missed follow-up</div></div>' +
            tile('zapier', 520, 700, -4, size=88) + tile('n8n', 660, 710, 4, size=88) + tile('make', 800, 700, -4, size=88) + tile('python', 940, 710, 4, size=88) + tile('airtable', 940, 470, 5, size=88))


SCENES = {'web': web, 'mobile': mobile, 'systems': systems, 'marketing': marketing, 'consulting': consulting}
for k, f in SCENES.items():
    open(f'/home/claude/scenes/{k}.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="s">{f()}</div></body></html>')
print('ok')
