import json
try:
    with open('db_backup.json') as f:
        print(f.read())
except Exception as e:
    print(e)
