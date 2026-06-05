# Documento de Requisitos

## Introdução

Sistema de treino de multiplicação (tabuadas de 2 a 10) voltado para crianças de aproximadamente 8 anos. O sistema utiliza uma abordagem de progressão por desbloqueio, onde o aluno começa nas tabuadas mais fáceis e desbloqueia as próximas ao demonstrar domínio. O visual é infantil e lúdico, com cores vibrantes, emojis de conquista e animações de feedback. A persistência de dados é feita via localStorage. O projeto é construído do zero com React + TypeScript.

## Glossário

- **Sistema**: A aplicação web de treino de multiplicação
- **Aluno**: O usuário da aplicação (criança de ~8 anos)
- **Tabuada**: Um conjunto de exercícios de multiplicação referentes a um número específico (ex: tabuada do 5 = 5×1, 5×2, ..., 5×10)
- **Sessão_de_Prática**: Uma sequência de questões apresentadas ao aluno dentro de uma tabuada específica
- **Nível_de_Domínio**: Percentual de acertos acumulados do aluno em uma tabuada específica
- **Limiar_de_Desbloqueio**: Percentual mínimo de acertos (80%) necessário para desbloquear a próxima tabuada
- **Feedback_Visual**: Animações, cores e emojis exibidos ao aluno após responder uma questão
- **Progresso**: Conjunto de dados sobre o desempenho do aluno, incluindo tabuadas desbloqueadas, acertos e erros

## Requisitos

### Requisito 1 — Exibição de Questões de Multiplicação

**User Story:** Como aluno, quero ver questões de multiplicação na tela, para que eu possa praticar as tabuadas.

#### Critérios de Aceitação

1. WHEN uma Sessão_de_Prática é iniciada, THE Sistema SHALL exibir uma questão de multiplicação no formato "A × B = ?" onde A é o número da tabuada selecionada (2 a 10) e B é um número de 1 a 10.
2. WHEN uma questão é exibida, THE Sistema SHALL apresentar um campo de entrada numérica para o aluno digitar a resposta.
3. WHEN o aluno submete uma resposta, THE Sistema SHALL avaliar se a resposta está correta comparando com o produto de A × B.

### Requisito 2 — Feedback de Resposta Correta

**User Story:** Como aluno, quero receber feedback positivo quando acerto, para que eu me sinta motivado a continuar.

#### Critérios de Aceitação

1. WHEN o aluno submete uma resposta correta, THE Sistema SHALL exibir Feedback_Visual positivo com emojis de conquista (🌟) e uma animação de celebração por 1,5 segundos.
2. WHEN o Feedback_Visual positivo é exibido por 1,5 segundos, THE Sistema SHALL avançar automaticamente para a próxima questão.

### Requisito 3 — Feedback de Resposta Incorreta

**User Story:** Como aluno, quero ver a resposta correta quando erro, para que eu aprenda com meus erros.

#### Critérios de Aceitação

1. WHEN o aluno submete uma resposta incorreta, THE Sistema SHALL exibir a resposta correta de forma destacada na tela por 3 segundos.
2. WHEN o aluno submete uma resposta incorreta, THE Sistema SHALL exibir Feedback_Visual de encorajamento (sem punição ou linguagem negativa).
3. WHEN o período de exibição da resposta correta (3 segundos) se encerra, THE Sistema SHALL avançar automaticamente para a próxima questão.

### Requisito 4 — Progressão por Desbloqueio de Tabuadas

**User Story:** Como aluno, quero desbloquear novas tabuadas conforme demonstro domínio, para que eu tenha uma sensação de conquista e progresso.

#### Critérios de Aceitação

1. THE Sistema SHALL iniciar com a tabuada do 2 desbloqueada e as tabuadas de 3 a 10 bloqueadas.
2. WHEN o Nível_de_Domínio do aluno em uma tabuada atinge o Limiar_de_Desbloqueio (80% de acerto em pelo menos 10 questões respondidas), THE Sistema SHALL desbloquear a próxima tabuada na sequência.
3. WHEN uma nova tabuada é desbloqueada, THE Sistema SHALL exibir uma animação de conquista com emoji de troféu (🏆) e mensagem de parabéns.
4. WHILE uma tabuada está bloqueada, THE Sistema SHALL exibir a tabuada com visual de cadeado, impedindo o aluno de selecioná-la.

### Requisito 5 — Tela de Seleção de Tabuadas

**User Story:** Como aluno, quero ver todas as tabuadas disponíveis, para que eu possa escolher qual praticar.

#### Critérios de Aceitação

1. THE Sistema SHALL exibir uma tela de seleção com cards representando cada tabuada de 2 a 10.
2. WHILE uma tabuada está desbloqueada, THE Sistema SHALL exibir o card da tabuada com cores vibrantes e o Nível_de_Domínio atual do aluno.
3. WHEN o aluno seleciona uma tabuada desbloqueada, THE Sistema SHALL iniciar uma Sessão_de_Prática para a tabuada selecionada.

### Requisito 6 — Persistência de Progresso via localStorage

**User Story:** Como aluno, quero que meu progresso seja salvo automaticamente, para que eu não perca meus desbloqueios ao fechar o navegador.

#### Critérios de Aceitação

1. WHEN o aluno responde uma questão, THE Sistema SHALL salvar o Progresso atualizado no localStorage do navegador.
2. WHEN o aluno desbloqueia uma nova tabuada, THE Sistema SHALL salvar o estado de desbloqueio no localStorage.
3. WHEN o Sistema é carregado, THE Sistema SHALL restaurar o Progresso salvo no localStorage, incluindo tabuadas desbloqueadas e estatísticas.
4. IF os dados no localStorage estão corrompidos ou ausentes, THEN THE Sistema SHALL iniciar com o estado padrão (apenas tabuada do 2 desbloqueada, sem estatísticas).

### Requisito 7 — Estatísticas do Aluno

**User Story:** Como aluno, quero ver minhas estatísticas, para que eu saiba como estou me saindo.

#### Critérios de Aceitação

1. THE Sistema SHALL exibir o total de questões respondidas, total de acertos e percentual geral de acerto do aluno.
2. THE Sistema SHALL exibir estatísticas individuais por tabuada, incluindo quantidade de acertos, erros e Nível_de_Domínio.
3. WHEN o aluno acessa a tela de estatísticas, THE Sistema SHALL apresentar os dados em formato visual adequado para crianças (barras de progresso coloridas, emojis indicativos).

### Requisito 8 — Interface Visual Infantil e Lúdica

**User Story:** Como aluno, quero uma interface divertida e colorida, para que eu me sinta atraído a usar o aplicativo.

#### Critérios de Aceitação

1. THE Sistema SHALL utilizar uma paleta de cores vibrantes adequada ao público infantil.
2. THE Sistema SHALL utilizar fontes arredondadas e de tamanho grande (mínimo 18px para texto de corpo, mínimo 32px para números das questões).
3. THE Sistema SHALL exibir botões e áreas clicáveis com tamanho mínimo de 48×48 pixels para facilitar a interação de crianças.
4. THE Sistema SHALL incluir emojis e ilustrações lúdicas em todas as telas principais.

### Requisito 9 — Usabilidade e Acessibilidade

**User Story:** Como aluno, quero que o aplicativo seja fácil de usar, para que eu consiga navegar sem ajuda de adultos.

#### Critérios de Aceitação

1. THE Sistema SHALL permitir que o aluno submeta a resposta pressionando a tecla Enter ou tocando em um botão de confirmação visível.
2. THE Sistema SHALL posicionar o foco do cursor automaticamente no campo de resposta ao exibir cada nova questão.
3. THE Sistema SHALL exibir navegação simples com no máximo 2 níveis de profundidade (tela inicial → prática ou estatísticas).
4. THE Sistema SHALL ser responsivo, adaptando o layout para telas de desktop e tablet.

### Requisito 10 — Geração de Questões

**User Story:** Como aluno, quero que as questões variem, para que a prática não fique repetitiva.

#### Critérios de Aceitação

1. WHEN uma Sessão_de_Prática é iniciada, THE Sistema SHALL gerar questões em ordem aleatória dentro da tabuada selecionada.
2. THE Sistema SHALL evitar repetir a mesma questão consecutivamente dentro de uma Sessão_de_Prática.
3. WHEN o aluno completa todas as 10 combinações possíveis de uma tabuada em uma sessão, THE Sistema SHALL reiniciar o ciclo com uma nova ordem aleatória.
