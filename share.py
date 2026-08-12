import os, sys, time, subprocess

TOKEN = "3Hp2W0kAaEbd9dnsg4VYZUG1s23_7UYSmpYgxurXELWYqcPJt"

print("\n" + "="*50)
print("  FLICK - Sharing your app...")  
print("="*50)

# Add auth token
os.system(f'ngrok config add-authtoken {TOKEN}')

# Start backend
print("\n Starting server...")
backend = subprocess.Popen(
    [sys.executable, 'backend/wsgi.py'],
    cwd=os.path.dirname(os.path.abspath(__file__))
)
time.sleep(4)

# Start ngrok
print(" Creating public link...")
ngrok_proc = subprocess.Popen(
    ['ngrok', 'http', '5000', '--log=stdout'],
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    text=True
)

# Wait for URL
url = None
for line in ngrok_proc.stdout:
    if 'url=' in line.lower() and 'https' in line:
        import re
        match = re.search(r'https://[^\s]+\.ngrok[^\s]*', line)
        if match:
            url = match.group(0)
            break
    if ngrok_proc.poll() is not None:
        break

if url:
    print(f"\n YOUR APP IS LIVE!")
    print(f"\n Share this link with anyone:")
    print(f"\n   {url}")
    print(f"\n Anyone can open this on phone or laptop!")
    print(f" Keep this window open while sharing.")
    print(f" Press Ctrl+C to stop.\n")
    print("="*50)
    import webbrowser
    webbrowser.open(url)
    try:
        while True: time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopped.")
else:
    print("\n Could not get URL. Trying alternate method...")
    import webbrowser
    webbrowser.open("http://localhost:4040")
    print(" Check http://localhost:4040 for your URL")
    try:
        while True: time.sleep(1)
    except KeyboardInterrupt:
        pass

backend.terminate()
ngrok_proc.terminate()
