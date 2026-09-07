# Rascunho — Segurança dos dados da Play Store

Data da auditoria: **7 de setembro de 2026**. Este documento descreve a branch `fix/automatic-progress-save`. Revalidar depois de inserir os IDs reais do AdMob e antes de enviar o formulário da Play Console.

## Comportamento próprio do aplicativo

| Dado | Onde fica | Obrigatório | Finalidade | Compartilhamento |
| --- | --- | --- | --- | --- |
| Moedas e níveis FINGO/BINGO/SPINGO | Aparelho; pasta privada do Drive quando o usuário conecta Google | Local: sim; Drive: não | Funcionamento e backup | Drive processa o backup solicitado pelo usuário |
| Preferências de música, efeitos e vibração | Aparelho | Sim para conservar escolhas | Funcionalidade | Não |
| Identificador da Conta Google | Aparelho e dentro do backup privado | Não | Associar e validar o backup da própria conta | Google Drive |
| E-mail e nome de exibição Google | E-mail no aparelho; nome usado somente na sessão/interface | Não | Mostrar e retomar a conta conectada | Não enviados ao servidor da RIX.LAB |
| Data e hora do backup | Pasta privada do Drive | Não | Identificar versões do progresso | Google Drive |
| Token OAuth | Memória do processo | Não | Autorizar a sincronização | Google; não persistido pelo jogo |

O aplicativo não contém servidor próprio, cadastro por senha, compras, localização precisa, contatos, fotos, arquivos pessoais, mensagens, dados de saúde ou dados financeiros. A permissão Drive é `drive.appdata`; ela não acessa os demais arquivos do usuário.

## Dados do Google Mobile Ads SDK

Com anúncios reais habilitados, a documentação oficial do SDK informa coleta e compartilhamento automático para publicidade, análise e prevenção de fraude:

- endereço IP, que pode estimar localização geral;
- interações com o aplicativo e anúncios, incluindo inicialização, toques e visualizações de vídeo;
- informações de diagnóstico e desempenho;
- identificadores do dispositivo e da conta, incluindo ID de publicidade e App Set ID quando disponíveis.

Todos esses itens devem ser considerados no formulário da Play Store. A resposta final deve refletir a versão exata do Google Mobile Ads SDK incluída no `.aab` enviado.

## Respostas preliminares para o formulário

- **O app coleta ou compartilha dados?** Sim, por causa do backup Google opcional e do Google Mobile Ads SDK.
- **Os dados são criptografados em trânsito?** Sim, as integrações usam HTTPS/TLS.
- **O usuário pode solicitar exclusão?** O usuário pode apagar dados locais nas configurações do Android e excluir os dados ocultos do aplicativo nas configurações do próprio Google Drive. A RIX.LAB não mantém servidor próprio com cópia do backup.
- **Conta obrigatória?** Não. O jogo funciona localmente sem login Google.
- **Coleta opcional?** Login/backup e visualização de anúncios premiados são iniciados pelo usuário. Confirmar no formulário como cada categoria do SDK deve ser declarada globalmente.
- **Dados compartilhados?** Declarar os tipos informados pelo guia do Google Mobile Ads SDK. Tratar Drive conforme a definição vigente de provedor de serviço apresentada pelo formulário.

## Referências oficiais usadas

- [Divulgação de dados do Google Mobile Ads SDK](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- [Formulário Segurança dos dados](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Pasta privada de dados do aplicativo no Drive](https://developers.google.com/workspace/drive/api/guides/appdata)
- [Política de dados do usuário das APIs Google](https://developers.google.com/terms/api-services-user-data-policy)
- [Consentimento de usuários do EEE, Reino Unido e Suíça](https://developers.google.com/admob/android/privacy/gdpr)
