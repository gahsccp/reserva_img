/* ==================================================
   OBTENDO OS ELEMENTOS HTML
   Este bloco encontra o campo de jogo, os indicadores de
   resultado e os elementos da janela de vitória ou derrota.
   ================================================== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const remainingElement = document.getElementById("remaining");
const livesElement = document.getElementById("lives");

const overlay = document.getElementById("overlay");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const restartButton = document.getElementById("restartButton");


/* ==================================================
   IMAGEM DO JOGADOR
   Aqui é definido o caminho para a imagem do personagem.

   Se a imagem não carregar, o jogo desenhará
   automaticamente a nave neon padrão.
   ================================================== */

const playerImage = new Image();
let playerImageLoaded = false;

/* Caminho para a imagem do jogador */
playerImage.src = "player.png";

playerImage.addEventListener("load", () => {
  playerImageLoaded = true;
});

playerImage.addEventListener("error", () => {
  playerImageLoaded = false;

  console.warn(
    "Não foi possível carregar a imagem do jogador. O jogador padrão será utilizado."
  );
});


/* ==================================================
   IMAGEM DE FUNDO
   Aqui é definido o caminho para a imagem de fundo do jogo.

   Se a imagem não carregar, o jogo usará
   automaticamente o fundo padrão com estrelas e grade.
   ================================================== */

const backgroundImage = new Image();
let backgroundImageLoaded = false;

/* Caminho para a imagem de fundo */
backgroundImage.src = "background.png";

backgroundImage.addEventListener("load", () => {
  backgroundImageLoaded = true;
});

backgroundImage.addEventListener("error", () => {
  backgroundImageLoaded = false;

  console.warn(
    "Não foi possível carregar a imagem de fundo. O fundo padrão será utilizado."
  );
});


/* ==================================================
   VARIÁVEIS PRINCIPAIS DO JOGO
   Este bloco armazena as teclas pressionadas, a pontuação,
   as vidas e o estado do loop do jogo.
   ================================================== */

const keys = {};

let score = 0;
let lives = 3;
let gameRunning = true;
let animationId;


/* ==================================================
   CONFIGURAÇÕES DO JOGADOR
   Este objeto armazena a posição, o tamanho, a velocidade,
   o estado de invencibilidade e o tamanho visual da imagem.

   imageWidth e imageHeight afetam apenas a aparência.
   O tamanho da colisão continua sendo definido por size.
   ================================================== */

const player = {
  x: 70,
  y: 220,
  size: 30,
  speed: 4.5,
  invincible: false,

  /* Tamanho visual da imagem do jogador */
  imageWidth: 46,
  imageHeight: 36
};


/* ==================================================
   CONFIGURAÇÕES DA IMAGEM DE FUNDO
   overlayOpacity define o nível de escurecimento da imagem.

   0 — sem escurecimento.
   1 — imagem totalmente escurecida.
   ================================================== */

const backgroundSettings = {
  overlayOpacity: 0.28
};


/* ==================================================
   LISTAS (ARRAYS) DE OBJETOS DO JOGO
   Aqui ficam armazenados os cristais, os inimigos,
   as partículas e as estrelas do fundo.
   ================================================== */

let crystals = [];
let enemies = [];
let particles = [];
let stars = [];


/* ==================================================
   CRIAÇÃO DAS ESTRELAS DE FUNDO
   A função cria pontos aleatórios para o fundo padrão.
   Eles são usados caso a imagem de fundo não carregue.
   ================================================== */

function createStars() {
  stars = [];

  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.7 + 0.2
    });
  }
}


/* ==================================================
   CRIAÇÃO DOS CRISTAIS
   A função posiciona no campo os objetos que o jogador
   precisa coletar para vencer.
   ================================================== */

function createCrystals() {
  const positions = [
    [150, 90],
    [310, 180],
    [470, 80],
    [650, 150],
    [210, 380],
    [410, 330],
    [610, 400],
    [735, 275]
  ];

  crystals = positions.map(([x, y]) => ({
    x,
    y,
    size: 13,
    collected: false,
    angle: Math.random() * Math.PI * 2
  }));
}


/* ==================================================
   CRIAÇÃO DOS INIMIGOS
   A função cria os drones vermelhos e define suas
   posições iniciais e velocidades de movimento.
   ================================================== */

function createEnemies() {
  enemies = [
    {
      x: 250,
      y: 60,
      size: 28,
      vx: 2.2,
      vy: 1.6
    },
    {
      x: 540,
      y: 240,
      size: 30,
      vx: -2.5,
      vy: 1.8
    },
    {
      x: 680,
      y: 430,
      size: 26,
      vx: 2,
      vy: -2.3
    }
  ];
}


/* ==================================================
   REINICIAR O JOGO
   A função restaura a pontuação, as vidas e o personagem
   para o estado inicial e recria os objetos.
   ================================================== */

function resetGame() {
  cancelAnimationFrame(animationId);

  score = 0;
  lives = 3;
  gameRunning = true;

  player.x = 70;
  player.y = 220;
  player.invincible = false;

  particles = [];

  createStars();
  createCrystals();
  createEnemies();

  updatePanel();

  overlay.classList.remove("visible");

  gameLoop();
}


/* ==================================================
   ATUALIZAÇÃO DO PAINEL DE PONTUAÇÃO
   A função exibe a pontuação atual, as vidas
   e a quantidade de cristais restantes.
   ================================================== */

function updatePanel() {
  const remaining = crystals.filter(
    crystal => !crystal.collected
  ).length;

  scoreElement.textContent = score;
  remainingElement.textContent = remaining;
  livesElement.textContent = lives;
}


/* ==================================================
   CRIAÇÃO DE PARTÍCULAS
   A função cria um efeito visual ao coletar um cristal
   ou colidir com um drone.
   ================================================== */

function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      size: Math.random() * 4 + 2,
      life: 35,
      color
    });
  }
}


/* ==================================================
   VERIFICAÇÃO DE COLISÕES
   A função verifica se o jogador encostou
   em um cristal ou em um drone.
   ================================================== */

function isColliding(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  const distance = Math.sqrt(
    dx * dx + dy * dy
  );

  return distance < a.size / 2 + b.size;
}


/* ==================================================
   CONTROLE DO JOGADOR
   A função move o personagem conforme as setas pressionadas
   e impede que ele saia dos limites do campo.
   ================================================== */

function updatePlayer() {
  if (keys.ArrowUp) {
    player.y -= player.speed;
  }

  if (keys.ArrowDown) {
    player.y += player.speed;
  }

  if (keys.ArrowLeft) {
    player.x -= player.speed;
  }

  if (keys.ArrowRight) {
    player.x += player.speed;
  }

  const half = player.size / 2;

  player.x = Math.max(
    half,
    Math.min(canvas.width - half, player.x)
  );

  player.y = Math.max(
    half,
    Math.min(canvas.height - half, player.y)
  );
}


/* ==================================================
   ATUALIZAÇÃO DOS CRISTAIS
   A função gira os cristais, verifica a coleta,
   soma pontos e ativa a vitória.
   ================================================== */

function updateCrystals() {
  crystals.forEach(crystal => {
    crystal.angle += 0.04;

    if (
      !crystal.collected &&
      isColliding(player, crystal)
    ) {
      crystal.collected = true;
      score += 100;

      createParticles(
        crystal.x,
        crystal.y,
        "#fde047",
        18
      );

      updatePanel();

      const allCollected = crystals.every(
        item => item.collected
      );

      if (allCollected) {
        endGame(true);
      }
    }
  });
}


/* ==================================================
   ATUALIZAÇÃO DOS INIMIGOS
   A função move os drones, faz eles quicarem nas paredes
   e trata as colisões com o jogador.
   ================================================== */

function updateEnemies() {
  enemies.forEach(enemy => {
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;

    const halfSize = enemy.size / 2;

    if (
      enemy.x < halfSize ||
      enemy.x > canvas.width - halfSize
    ) {
      enemy.vx *= -1;
    }

    if (
      enemy.y < halfSize ||
      enemy.y > canvas.height - halfSize
    ) {
      enemy.vy *= -1;
    }

    if (
      !player.invincible &&
      isColliding(player, enemy)
    ) {
      lives -= 1;
      score = Math.max(0, score - 50);

      player.invincible = true;

      createParticles(
        player.x,
        player.y,
        "#fb7185",
        25
      );

      player.x = 70;
      player.y = 220;

      updatePanel();

      setTimeout(() => {
        player.invincible = false;
      }, 1300);

      if (lives <= 0) {
        endGame(false);
      }
    }
  });
}


/* ==================================================
   ATUALIZAÇÃO DAS PARTÍCULAS
   A função move as partículas, reduz seu tamanho
   aos poucos e remove as que já desapareceram.
   ================================================== */

function updateParticles() {
  particles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    particle.vx *= 0.97;
    particle.vy *= 0.97;

    particle.life -= 1;
    particle.size *= 0.97;
  });

  particles = particles.filter(
    particle => particle.life > 0
  );
}


/* ==================================================
   DESENHO DO FUNDO
   Se a imagem carregar, ela será utilizada.

   Se a imagem não carregar, será usado o fundo
   padrão com estrelas e grade neon.
   ================================================== */

function drawBackground() {
  if (backgroundImageLoaded) {
    drawBackgroundImage();
  } else {
    drawDefaultBackground();
  }
}


/* ==================================================
   DESENHO DA IMAGEM DE FUNDO
   A imagem preenche todo o canvas sem distorcer as proporções.

   Se as proporções da imagem e do campo de jogo forem
   diferentes, o excesso é recortado nas bordas.
   ================================================== */

function drawBackgroundImage() {
  const canvasRatio = canvas.width / canvas.height;

  const imageRatio =
    backgroundImage.naturalWidth /
    backgroundImage.naturalHeight;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = backgroundImage.naturalWidth;
  let sourceHeight = backgroundImage.naturalHeight;

  if (imageRatio > canvasRatio) {
    sourceWidth =
      backgroundImage.naturalHeight * canvasRatio;

    sourceX =
      (backgroundImage.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight =
      backgroundImage.naturalWidth / canvasRatio;

    sourceY =
      (backgroundImage.naturalHeight - sourceHeight) / 2;
  }

  ctx.drawImage(
    backgroundImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  /* O escurecimento melhora a visibilidade dos objetos do jogo */
  ctx.fillStyle =
    `rgba(3, 4, 10, ${backgroundSettings.overlayOpacity})`;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
}


/* ==================================================
   DESENHO PADRÃO DO FUNDO
   Esta função mantém o fundo original do jogo.
   Ela é usada como alternativa caso a imagem falhe.
   ================================================== */

function drawDefaultBackground() {
  ctx.fillStyle = "#070a18";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  stars.forEach(star => {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();

    ctx.arc(
      star.x,
      star.y,
      star.size,
      0,
      Math.PI * 2
    );

    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}


/* ==================================================
   DESENHO DO JOGADOR
   Se a imagem carregar, a função a desenha na tela.

   Se a imagem não carregar, o jogo desenha
   a nave original usando formas do Canvas.
   ================================================== */

function drawPlayer() {
  const isHidden =
    player.invincible &&
    Math.floor(Date.now() / 100) % 2 === 0;

  if (isHidden) {
    return;
  }

  if (playerImageLoaded) {
    drawPlayerImage();
  } else {
    drawDefaultPlayer();
  }
}


/* ==================================================
   DESENHO DA IMAGEM DO JOGADOR
   A imagem fica centralizada nas coordenadas do jogador.

   Seu tamanho visual não altera o tamanho da colisão.
   ================================================== */

function drawPlayerImage() {
  ctx.save();

  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 18;

  ctx.drawImage(
    playerImage,
    player.x - player.imageWidth / 2,
    player.y - player.imageHeight / 2,
    player.imageWidth,
    player.imageHeight
  );

  ctx.restore();
}


/* ==================================================
   DESENHO PADRÃO DO JOGADOR
   Esta função contém o código original da nave.
   Ela é usada como alternativa caso a imagem falhe.
   ================================================== */

function drawDefaultPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#67e8f9";

  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-14, -13);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-14, 13);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 12;
  ctx.fillStyle = "#a855f7";

  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-23, 0);
  ctx.lineTo(-10, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}


/* ==================================================
   DESENHO DOS CRISTAIS
   A função desenha todos os cristais que o jogador
   ainda não coletou.
   ================================================== */

function drawCrystals() {
  crystals.forEach(crystal => {
    if (crystal.collected) {
      return;
    }

    ctx.save();

    ctx.translate(
      crystal.x,
      crystal.y
    );

    ctx.rotate(crystal.angle);

    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#fde047";

    ctx.beginPath();
    ctx.moveTo(0, -crystal.size);
    ctx.lineTo(crystal.size * 0.75, 0);
    ctx.lineTo(0, crystal.size);
    ctx.lineTo(-crystal.size * 0.75, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.7;

    ctx.beginPath();
    ctx.moveTo(0, -crystal.size + 3);
    ctx.lineTo(3, 0);
    ctx.lineTo(0, 4);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  });

  ctx.globalAlpha = 1;
}


/* ==================================================
   DESENHO DOS INIMIGOS
   A função desenha os drones vermelhos em movimento.
   ================================================== */

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.save();

    ctx.translate(
      enemy.x,
      enemy.y
    );

    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ef4444";

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      enemy.size / 2,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#450a0a";

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      enemy.size / 4,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#fca5a5";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(-enemy.size / 2 - 7, 0);
    ctx.lineTo(enemy.size / 2 + 7, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -enemy.size / 2 - 7);
    ctx.lineTo(0, enemy.size / 2 + 7);
    ctx.stroke();

    ctx.restore();
  });
}


/* ==================================================
   DESENHO DAS PARTÍCULAS
   A função desenha pequenos elementos brilhantes
   após a coleta de um cristal ou colisão.
   ================================================== */

function drawParticles() {
  particles.forEach(particle => {
    ctx.globalAlpha = particle.life / 35;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 10;

    ctx.beginPath();

    ctx.arc(
      particle.x,
      particle.y,
      Math.max(0.5, particle.size),
      0,
      Math.PI * 2
    );

    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}


/* ==================================================
   FIM DE JOGO
   A função interrompe o jogo e exibe a mensagem
   de vitória ou derrota com a pontuação final.
   ================================================== */

function endGame(won) {
  gameRunning = false;

  resultTitle.textContent = won
    ? "Você venceu!"
    : "Fim de jogo";

  resultText.textContent = won
    ? `Você coletou todos os cristais. Pontuação final: ${score}.`
    : `Os drones impediram a sua missão. Pontuação final: ${score}.`;

  overlay.classList.add("visible");
}


/* ==================================================
   LOOP PRINCIPAL DO JOGO
   A função atualiza continuamente o estado do jogo
   e desenha novamente todos os objetos na tela.
   ================================================== */

function gameLoop() {
  drawBackground();

  if (gameRunning) {
    updatePlayer();
    updateCrystals();
    updateEnemies();
    updateParticles();
  }

  drawCrystals();
  drawEnemies();
  drawPlayer();
  drawParticles();

  if (gameRunning) {
    animationId = requestAnimationFrame(gameLoop);
  }
}


/* ==================================================
   CONTROLE DE TECLAS PRESSIONADAS
   Este bloco registra quais setas estão pressionadas
   e desativa a rolagem padrão da página.
   ================================================== */

window.addEventListener("keydown", event => {
  const arrowKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight"
  ];

  if (arrowKeys.includes(event.key)) {
    event.preventDefault();
    keys[event.key] = true;
  }
});


/* ==================================================
   CONTROLE DE TECLAS SOLTAS
   Este bloco interrompe o movimento na direção
   da tecla que foi solta.
   ================================================== */

window.addEventListener("keyup", event => {
  keys[event.key] = false;
});


/* ==================================================
   BOTÃO JOGAR NOVAMENTE
   Ao clicar no botão, o jogo é reiniciado do zero.
   ================================================== */

restartButton.addEventListener(
  "click",
  resetGame
);


/* ==================================================
   PRIMEIRA EXECUÇÃO DO JOGO
   Este comando inicia o jogo assim que a página carrega.
   ================================================== */

resetGame();