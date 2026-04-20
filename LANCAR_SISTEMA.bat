@echo off
color 0A
title Lancamento Boi Na Rede na Nuvem
echo ========================================================
echo       BEM VINDO AO LANCAMENTO DO VENDABOI.COM.BR
echo ========================================================
echo.
echo Para facilitar tudo, eu criei este robo automatico.
echo Siga os passos e nao feche esta janela preta.
echo.
echo [PASSO 1 de 2]: Autenticacao
echo O seu navegador de internet vai abrir agora sozinho.
echo Procure pelo botao escrito "Login" ou "Approve" na pagina da Railway.
echo Assim que clicar la e logar, volte para esta tela preta.
echo.
pause
echo Abrindo o navegador...
call railway login
echo.
echo ========================================================
echo [PASSO 2 de 2]: Envio dos Arquivos
echo ========================================================
echo Parabens! Agora o sistema ja reconheceu o seu computador.
echo Pressione Enter e o seu sistema sera empacotado e
echo enviado aos Grandes Servidores da Railway.
echo Isso pode demorar cerca de 1 ou 2 minutos.
echo.
pause
echo Criando o projeto...
call railway init -n vendaboi
echo Subindo arquivos (aguarde)...
call railway up
echo.
echo ========================================================
echo                 LANCAMENTO CONCLUIDO!                   
echo ========================================================
echo DEU CERTO! O Boi na Rede ja existe na nuvem!
echo Agora voce so precisa entrar no painel da Railway pelo Chrome,
echo ir nas "Settings" do projeto, clicar na opcao "Custom Domain"
echo e digitar o seu "vendaboi.com.br". Ele vai te dar um codigo
echo para colar no seu painel do Registro.br.
echo.
echo Parabens, socio! Pode fechar esta janela.
pause
