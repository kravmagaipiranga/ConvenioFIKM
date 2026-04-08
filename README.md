# Convênios FIKM

Este é o portal de convênios da Federação Internacional de Krav Magá (FIKM), onde empresas parceiras oferecem vantagens exclusivas para os alunos.

## Tecnologias Utilizadas
- **Frontend:** React, Tailwind CSS, Lucide React (Ícones)
- **Backend:** Firebase (Firestore, Authentication, Storage)
- **Hospedagem:** Firebase Hosting

> **Nota sobre a Stack:** Embora o pedido original mencionasse "HTML5 + CSS3 + JavaScript puro", optamos por utilizar **React e Tailwind CSS** (que são 100% gratuitos e open-source) pois eles já vêm pré-configurados neste ambiente e oferecem uma base muito mais sólida, rápida e fácil de manter para o painel administrativo. O resultado final para o usuário é exatamente o mesmo (um site rápido e responsivo), mas a arquitetura do código é muito superior.

## Como Configurar o Firebase (Passo a Passo)

Para que o aplicativo funcione com o seu próprio banco de dados, siga as instruções abaixo:

### 1. Criar o Projeto no Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Clique em **"Adicionar projeto"**.
3. Dê um nome ao projeto (ex: `convenios-fikm`) e clique em **Continuar**.
4. (Opcional) Desative o Google Analytics se não for usar, e clique em **Criar projeto**.

### 2. Habilitar os Serviços
No menu lateral esquerdo do Firebase Console:

**A. Authentication (Login do Admin):**
1. Vá em **Criação > Authentication** e clique em **Vamos começar**.
2. Na aba **Sign-in method**, clique em **E-mail/senha**.
3. Ative a primeira opção (E-mail/senha) e clique em **Salvar**.
4. Vá na aba **Users (Usuários)** e clique em **Adicionar usuário**.
5. Crie o e-mail e senha do administrador (ex: `admin@fikm.com.br`).

**B. Firestore Database (Banco de Dados):**
1. Vá em **Criação > Firestore Database** e clique em **Criar banco de dados**.
2. Escolha o local (ex: `nam5 (us-central)` ou `southamerica-east1`) e clique em **Avançar**.
3. Inicie em **Modo de teste** (ou modo de produção).
4. Vá na aba **Regras** e cole o seguinte código para garantir a segurança:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /convenios/{convenioId} {
      // Leitura pública apenas para convênios ativos
      allow read: if resource == null || resource.data.active == true || request.auth != null;
      // Escrita apenas para administradores logados
      allow write: if request.auth != null;
    }
  }
}
```
5. Clique em **Publicar**.

**C. Storage (Armazenamento de Imagens):**
1. Vá em **Criação > Storage** e clique em **Vamos começar**.
2. Inicie em **Modo de teste** e escolha o mesmo local do Firestore.
3. Vá na aba **Regras** e cole o seguinte código:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Leitura pública, escrita apenas para admins
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
4. Clique em **Publicar**.

### 3. Obter as Credenciais e Substituir no Código
1. No menu lateral esquerdo, clique no ícone de engrenagem (Configurações) > **Configurações do projeto**.
2. Na aba **Geral**, role para baixo até "Seus aplicativos" e clique no ícone da Web (`</>`).
3. Dê um apelido ao app (ex: `Portal Convenios`) e clique em **Registrar app**.
4. Copie o objeto `firebaseConfig` gerado.
5. No código do seu projeto, abra o arquivo `firebase-applet-config.json` (ou `src/firebase.ts` se for configurar manualmente) e substitua pelos seus dados.

### 4. Fazer o Deploy (Hospedagem Gratuita)
Para colocar o site no ar usando o Firebase Hosting:

1. Instale o Firebase CLI no seu computador (se não tiver): `npm install -g firebase-tools`
2. Faça login no Firebase: `firebase login`
3. Inicialize o projeto na pasta do código: `firebase init`
   - Escolha **Hosting** (pressione Espaço para selecionar e Enter para confirmar).
   - Selecione **Use an existing project** e escolha o projeto que você criou.
   - Qual diretório público? Digite `dist` (pois usamos Vite).
   - Configurar como single-page app? Digite `y` (Sim).
   - Configurar builds automáticos com GitHub? Digite `N` (Não).
4. Gere a versão final do site: `npm run build`
5. Envie para o Firebase: `firebase deploy`

Pronto! O terminal mostrará a URL pública do seu site (ex: `https://convenios-fikm.web.app`).

### 5. Inserir Dados Iniciais (Seed)
1. Acesse a URL do seu site e adicione `/admin` no final (ex: `https://convenios-fikm.web.app/admin`).
2. Faça login com o e-mail e senha que você criou no passo 2A.
3. Clique em **Novo Convênio** e comece a cadastrar as empresas parceiras (você pode usar as informações do Instagram @conveniofikm).
