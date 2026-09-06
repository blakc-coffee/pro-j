import urllib.request
import json
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(path):
    url = f"{BASE_URL}{path}"
    print(f"\nTesting: {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "TestClient"})
        with urllib.request.urlopen(req) as resp:
            status = resp.getcode()
            body = resp.read().decode('utf-8')
            try:
                parsed = json.loads(body)
                print(f"Status: {status} OK")
                print(f"Response (truncated/preview): {json.dumps(parsed, indent=2)[:300]}...")
            except:
                print(f"Status: {status} OK")
                print(f"Response: {body[:200]}")
            return status, body
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode('utf-8')
        print(f"Status: {status} (HTTPError)")
        print(f"Response: {body}")
        return status, body
    except Exception as e:
        print(f"Error: {e}")
        return None, str(e)

if __name__ == "__main__":
    print("=== LIVE FASTAPI SERVER HTTP TESTS ===")
    test_endpoint("/")
    test_endpoint("/cab-queries")
    test_endpoint("/lost-found/items")
    test_endpoint("/lost-found/items?status=open&sort=newest")
