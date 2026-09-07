# Checklist de lançamento Android

Início do acompanhamento: **7 de setembro de 2026**.

Use `[x]` para tarefas concluídas e mantenha `[ ]` enquanto faltar qualquer parte da validação.

## Concluído

- [x] Implementar salvamento local automático de moedas e níveis.
- [x] Implementar backup automático na pasta privada do aplicativo no Google Drive.
- [x] Criar o projeto `Bingo Plinko Lucky Machine` no Google Cloud.
- [x] Ativar a Google Drive API.
- [x] Configurar o escopo `drive.appdata` como acesso não confidencial.
- [x] Criar o cliente OAuth Web usado pelo login.
- [x] Adicionar `brand.ricxlab@gmail.com` como usuário de teste do OAuth.
- [x] Manter os anúncios em modo de teste durante o desenvolvimento.
- [x] Enviar a implementação para a branch `fix/automatic-progress-save`.

## Pode ser feito enquanto a Play Console verifica os documentos

- [x] Criar a política de privacidade do jogo.
- [x] Criar os termos de uso.
- [x] Criar uma página pública de suporte.
- [x] Publicar as páginas legais em endereços HTTPS permanentes.
- [x] Inserir os endereços públicos no branding do Google Auth Platform.
- [ ] Confirmar que o Google permite publicar a configuração OAuth para qualquer Conta Google.
- [ ] Criar ou concluir a conta do AdMob.
- [ ] Cadastrar o jogo no AdMob como aplicativo ainda não publicado.
- [ ] Criar as unidades de anúncio premiado necessárias.
- [ ] Guardar os IDs públicos do AdMob na configuração de build, sem versionar credenciais privadas.
- [x] Revisar o conteúdo da branch `fix/automatic-progress-save`.
- [x] Executar lint, testes, build web e sincronização do Capacitor.
- [x] Integrar a branch revisada na `master`.

## Depende da aprovação da Play Console

- [x] Confirmar que a verificação da conta de desenvolvedor foi aprovada.
- [ ] Criar o aplicativo na Play Console com o pacote definitivo `com.bingoplinko.game`.
- [ ] Ativar o Google Play App Signing.
- [ ] Obter o SHA-1 do certificado de assinatura da Play.
- [ ] Criar no Google Cloud o cliente OAuth Android com o pacote e o SHA-1 corretos.
- [ ] Confirmar o cliente OAuth usado por builds locais de teste e registrar outro SHA-1 se necessário.
- [ ] Configurar o Client ID público no ambiente de build da versão Android.
- [ ] Gerar o primeiro Android App Bundle (`.aab`) assinado.
- [ ] Enviar o `.aab` para a faixa de teste apropriada.

## Validação em aparelho Android físico

- [ ] Instalar o jogo pela faixa de teste da Play Store.
- [ ] Confirmar abertura, áudio, vibração, orientação e redimensionamento.
- [ ] Confirmar que moedas e níveis permanecem após fechar e reabrir o jogo.
- [ ] Confirmar que o jogo continua funcionando sem internet.
- [ ] Entrar com a Conta Google autorizada e concluir o primeiro backup.
- [ ] Alterar moedas ou nível e confirmar novo backup automático.
- [ ] Reinstalar em ambiente de teste e confirmar a restauração pela mesma Conta Google.
- [ ] Testar progresso diferente em dois aparelhos e validar a tela de escolha de backup.
- [ ] Revogar a autorização Google e confirmar que o jogo local continua disponível.
- [ ] Testar todos os anúncios premiados com IDs de teste.
- [ ] Confirmar que nenhuma recompensa é entregue quando o anúncio falha ou é fechado antes da conclusão.
- [ ] Trocar para os IDs reais do AdMob somente após os testes anteriores passarem.

## Cadastro e políticas da Play Store

- [ ] Definir nome, descrição curta e descrição completa.
- [ ] Preparar ícone, capturas de tela e imagem de destaque.
- [ ] Informar e-mail e página pública de suporte.
- [ ] Informar a política de privacidade.
- [ ] Preencher a classificação etária.
- [ ] Preencher a seção Segurança dos dados de acordo com o comportamento final do aplicativo.
- [ ] Declarar que o jogo contém anúncios.
- [ ] Declarar o público-alvo e os países de distribuição.
- [ ] Revisar as políticas aplicáveis a anúncios premiados e conteúdo do jogo.

## Teste fechado e produção

- [ ] Criar a lista de testadores.
- [ ] Publicar a versão no teste fechado.
- [ ] Se exigido pela conta, manter pelo menos 12 testadores inscritos continuamente por 14 dias.
- [ ] Registrar problemas e feedback recebidos durante o teste.
- [ ] Corrigir problemas que impeçam login, backup, anúncios ou conclusão das partidas.
- [ ] Gerar e testar a versão candidata à produção.
- [ ] Solicitar acesso à produção na Play Console.
- [ ] Responder às perguntas sobre o teste fechado e a preparação do aplicativo.
- [ ] Enviar a versão para análise do Google Play.
- [ ] Confirmar a publicação e acompanhar falhas, avaliações e desempenho inicial.

## Critério para considerar o lançamento pronto

- [ ] A versão da Play Store abre e conclui partidas em aparelho físico.
- [ ] O progresso local sobrevive ao fechamento do aplicativo.
- [ ] O backup e a restauração funcionam com a mesma Conta Google.
- [ ] Os anúncios reais aparecem e concedem recompensa somente após conclusão válida.
- [ ] As páginas legais estão públicas e correspondem ao comportamento do jogo.
- [ ] A ficha da loja e a seção Segurança dos dados correspondem à versão enviada.
- [ ] Não existem credenciais privadas no repositório ou no pacote publicado.
