import os
import subprocess
import sys
import time

def run(command, cwd=None):
    res = subprocess.run(command, shell=True, cwd=cwd)
    return res.returncode == 0

def main():
    backend_dir = os.path.abspath(os.path.dirname(__file__))
    root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
    
    # используем питон и скрипты строго из локального .venv
    venv_dir = os.path.join(backend_dir, ".venv")
    if os.name == "nt":
        python = os.path.join(venv_dir, "Scripts", "python.exe")
        alembic_bin = os.path.join(venv_dir, "Scripts", "alembic.exe")
        uvicorn_bin = os.path.join(venv_dir, "Scripts", "uvicorn.exe")
    else:
        python = os.path.join(venv_dir, "bin", "python")
        alembic_bin = os.path.join(venv_dir, "bin", "alembic")
        uvicorn_bin = os.path.join(venv_dir, "bin", "uvicorn")

    if not os.path.exists(python):
        python = sys.executable
        alembic_bin = "alembic"
        uvicorn_bin = "uvicorn"

    # подъем базы данных в docker
    print("запуск базы данных в docker...")
    if not run("docker compose up -d db", cwd=root_dir):
        print("ошибка запуска docker")
        return

    # ожидание готовности postgres
    print("ожидание готовности базы данных...")
    for _ in range(15):
        res = subprocess.run("docker exec kanban_db pg_isready -U postgres", shell=True, capture_output=True)
        if res.returncode == 0:
            print("база данных готова")
            break
        time.sleep(1)

    # применение существующих миграций
    print("применение миграций...")
    run(f'"{alembic_bin}" upgrade head', cwd=backend_dir)

    # вывод таблиц
    print("список таблиц в базе:")
    subprocess.run('docker exec kanban_db psql -U postgres -d kanban_edu -c "\\dt"', shell=True)

    # запуск fastapi
    print("запуск fastapi на http://127.0.0.1:8000/docs")
    try:
        run(f'"{uvicorn_bin}" app.main:app --reload', cwd=backend_dir)
    except KeyboardInterrupt:
        print("сервер остановлен")

if __name__ == "__main__":
    main()
