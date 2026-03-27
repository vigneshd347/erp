import urllib.request
import urllib.parse

long_url = "http://example.com/?" + "A" * 3000

try:
    print("Testing tinyurl...")
    url = "https://tinyurl.com/api-create.php?url=" + urllib.parse.quote(long_url)
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print("Tinyurl error:", e)

try:
    print("Testing is.gd...")
    url = "https://is.gd/create.php?format=simple&url=" + urllib.parse.quote(long_url)
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print("is.gd error:", e)

