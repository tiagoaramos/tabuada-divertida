# Plano de Implementação: Math Multiplication Trainer

## Visão Geral

Implementação incremental de um SPA React + TypeScript (Vite) para treino de tabuadas. A construção segue a ordem: projeto base → domínio (funções puras) → persistência → estado global (Context) → componentes de UI → integração final.

## Tasks

- [x] 1. Inicializar projeto e estrutura base
  - [x] 1.1 Criar projeto Vite com React + TypeScript e instalar dependências
    - Inicializar com `npm create vite@latest` template react-ts
    - Instalar dependências de dev: vitest, @testing-library/react, @testing-library/jest-dom, fast-check, jsdom
    - Configurar `vitest.config.ts` com environment jsdom
    - Criar estrutura de diretórios: `src/domain/`, `src/components/`, `src/context/`, `src/types/`
    - _Requirements: 8.1, 8.2, 9.4_

  - [x] 1.2 Definir tipos e interfaces do domínio
    - Criar `src/types/index.ts` com todas as interfaces: `Question`, `TableStats`, `Progress`, `FeedbackState`, `PracticeSession`, `Screen`, `StoredProgress`
    - _Requirements: 1.1, 4.1, 7.2_

- [x] 2. Implementar camada de domínio (funções puras)
  - [x] 2.1 Implementar funções de avaliação e desbloqueio
    - Criar `src/domain/evaluation.ts` com `evaluateAnswer`
    - Criar `src/domain/unlock.ts` com `shouldUnlockNext` e `getNextTableToUnlock`
    - _Requirements: 1.3, 4.1, 4.2_

  - [ ]* 2.2 Escrever teste de propriedade para avaliação de respostas
    - **Property 1: Avaliação de respostas é matematicamente correta**
    - **Validates: Requirements 1.3**

  - [ ]* 2.3 Escrever teste de propriedade para lógica de desbloqueio
    - **Property 2: Lógica de desbloqueio respeita o limiar**
    - **Validates: Requirements 4.2**

  - [x] 2.4 Implementar geração de questões
    - Criar `src/domain/questions.ts` com `generateSessionQuestions` e `getNextQuestion`
    - Implementar shuffle (Fisher-Yates) e lógica de não-repetição consecutiva entre ciclos
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 2.5 Escrever teste de propriedade para geração de questões
    - **Property 6: Geração de questões é completa e sem repetição consecutiva**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 2.6 Implementar funções de estatísticas
    - Criar `src/domain/stats.ts` com `calculateMasteryLevel` e `calculateOverallStats`
    - _Requirements: 7.1, 7.2_

  - [ ]* 2.7 Escrever teste de propriedade para cálculo de estatísticas
    - **Property 5: Cálculo de estatísticas é matematicamente correto**
    - **Validates: Requirements 7.1, 7.2**

- [x] 3. Implementar camada de persistência
  - [x] 3.1 Implementar funções de persistência localStorage
    - Criar `src/domain/persistence.ts` com `saveProgress`, `loadProgress`, `getDefaultProgress`, `isValidStoredProgress`
    - Incluir `reconstructProgress` para converter `StoredProgress` → `Progress`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 3.2 Escrever teste de propriedade para round-trip de persistência
    - **Property 3: Round-trip de persistência de progresso**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 3.3 Escrever teste de propriedade para dados corrompidos
    - **Property 4: Dados corrompidos resultam em estado padrão**
    - **Validates: Requirements 6.4**

- [x] 4. Checkpoint - Verificar camada de domínio
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementar estado global (Context API)
  - [x] 5.1 Criar ProgressContext e provider
    - Criar `src/context/ProgressContext.tsx` com Context API
    - Implementar estado inicial via `loadProgress()`
    - Expor funções: `submitAnswer(tableNumber, answer, question)`, `startSession(tableNumber)`, `navigateTo(screen)`
    - Integrar `saveProgress` em cada mutação de estado
    - _Requirements: 6.1, 6.2, 4.2, 4.3_

- [x] 6. Implementar componentes de UI
  - [x] 6.1 Implementar componente App e navegação
    - Criar `src/App.tsx` com navegação por estado (`Screen`)
    - Envolver com `ProgressProvider`
    - Renderizar Header com navegação simples (botão voltar, botão stats)
    - _Requirements: 9.3_

  - [x] 6.2 Implementar TableSelectionScreen e TableCard
    - Criar `src/components/TableSelectionScreen.tsx` com grid de 9 cards
    - Criar `src/components/TableCard.tsx` com estados: desbloqueado (colorido + nível domínio) e bloqueado (🔒, não clicável)
    - Aplicar estilos vibrantes e lúdicos (cores, emojis, fontes grandes)
    - _Requirements: 5.1, 5.2, 5.3, 4.4, 8.1, 8.3, 8.4_

  - [x] 6.3 Implementar PracticeScreen, QuestionDisplay e AnswerInput
    - Criar `src/components/PracticeScreen.tsx` gerenciando sessão de prática
    - Criar `src/components/QuestionDisplay.tsx` exibindo "A × B = ?"
    - Criar `src/components/AnswerInput.tsx` com input numérico, submit via Enter ou botão
    - Foco automático no campo de resposta a cada nova questão
    - _Requirements: 1.1, 1.2, 1.3, 9.1, 9.2_

  - [x] 6.4 Implementar FeedbackOverlay
    - Criar `src/components/FeedbackOverlay.tsx`
    - Feedback positivo: emojis 🌟, animação de celebração, auto-avanço em 1.5s
    - Feedback negativo: exibir resposta correta, mensagem encorajadora, auto-avanço em 3s
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 6.5 Implementar UnlockCelebration
    - Criar `src/components/UnlockCelebration.tsx` como modal
    - Animação de troféu 🏆, mensagem de parabéns, botão de continuar
    - _Requirements: 4.3_

  - [x] 6.6 Implementar StatsScreen
    - Criar `src/components/StatsScreen.tsx` com estatísticas gerais e por tabuada
    - Barras de progresso coloridas, emojis indicativos, formato visual infantil
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 7. Checkpoint - Verificar componentes de UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Estilização e responsividade
  - [x] 8.1 Aplicar estilos globais e responsividade
    - Configurar CSS global com paleta de cores vibrantes
    - Fontes arredondadas, tamanhos mínimos (18px corpo, 32px números)
    - Áreas clicáveis mínimo 48×48px
    - Media queries para desktop e tablet
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.4_

- [x] 9. Integração final e testes de componente
  - [x] 9.1 Integrar todos os fluxos e verificar navegação completa
    - Conectar navegação entre telas (seleção → prática → stats)
    - Verificar fluxo completo: selecionar tabuada → responder → feedback → desbloqueio → persistência
    - _Requirements: 9.3, 5.3, 2.2, 3.3_

  - [ ]* 9.2 Escrever testes de integração dos componentes
    - Testar fluxo de resposta correta e incorreta com temporizadores
    - Testar desbloqueio de nova tabuada e exibição de celebração
    - Testar persistência e restauração de progresso
    - _Requirements: 1.3, 2.1, 3.1, 4.2, 6.3_

- [x] 10. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam as 6 propriedades universais de corretude definidas no design
- Testes unitários e de integração validam comportamentos específicos de UI
- A linguagem de implementação é TypeScript com React (Vite)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.4", "2.6", "3.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.5", "2.7", "3.2", "3.3"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2"] }
  ]
}
```
