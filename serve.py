#!/usr/bin/env python3
"""Local ARCANA LAB server. Picks a free port and disables HTTP caching."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import subprocess

ROOT = Path(__file__).resolve().parent
PORTS = range(8080, 8101)
BUILD = "Enhanced 2026.10.22-r6"


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


def create_server():
    os.chdir(ROOT)
    for port in PORTS:
        try:
            return ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler)
        except OSError:
            continue
    raise OSError("Nenhuma porta livre entre 8080 e 8100. Feche outra instância do ARCANA LAB e tente novamente.")


def main():
    try:
        server = create_server()
    except OSError as exc:
        print(f"Erro ao iniciar ARCANA LAB: {exc}")
        raise SystemExit(1)

    url = f"http://127.0.0.1:{server.server_port}/?build=enhanced-20261022-r6"
    print(f"ARCANA LAB — {BUILD}", flush=True)
    print(f"Servidor iniciado em: {url}", flush=True)
    print("Esta URL é local; 127.0.0.1 não é o número da versão.", flush=True)
    try:
        subprocess.Popen(["xdg-open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except OSError:
        print("Abra o endereço acima manualmente no navegador.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor do ARCANA LAB encerrado.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
