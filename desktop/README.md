# Ludicall para Windows (Electron)

Cliente desktop que abre `https://ludicall.base44.app` em uma janela Electron e permanece na bandeja do Windows.

## Gerar instalador

Na pasta `desktop`, rode:

```powershell
npm install
npm run dist
```

O instalador completo será criado em `dist/Ludicall Setup 1.0.3.exe`. Ele inclui os arquivos do Electron e não baixa o pacote durante a instalação. O Ludicall precisa de internet para carregar o serviço online.

## Bandeja do sistema

Fechar a janela pelo X esconde o Ludicall na bandeja. Clique no ícone para reabrir. No menu do botão direito, escolha **Sair** para encerrar o app.

Câmera, microfone e compartilhamento de tela usam as permissões do Electron.

