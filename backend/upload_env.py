import subprocess

def add_env(key, value):
    print(f"Adding {key}...")
    # First, try to remove the old one just in case it exists, otherwise add might fail/prompt
    subprocess.run(["npx", "vercel", "env", "rm", key, "production", "--yes"], shell=True, capture_output=True)
    
    # Add the new one by piping the value into the command
    p = subprocess.Popen(
        f"npx vercel env add {key} production", 
        shell=True,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    out, err = p.communicate(input=value + "\n")
    print(out)
    if err:
        print("Error:", err)

add_env("GMAIL_ADDRESS", "nithinchinna2577@gmail.com")
add_env("GMAIL_APP_PASSWORD", "jdhb toly bmqi hhen")
