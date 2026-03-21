/* ════════════════════════════════════════════
   questions.js — BUZZ! Quiz
   Contient : banque de questions par thème,
              fonction de pioche aléatoire
   Pour ajouter des questions : cherche le thème
   et ajoute un objet { q, a, c, f } à son tableau
   ════════════════════════════════════════════

   Format d'une question :
   {
     q : "Texte de la question",
     a : ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
     c : 2,        ← index de la bonne réponse (0=A, 1=B, 2=C, 3=D)
     f : "Anecdote ou explication (optionnel)"
   }
*/

let USED_QS = new Set(); // questions déjà posées dans la partie

const QUESTIONS = {
culture:[
  {q:"Quel est le plus grand pays du monde par superficie ?",a:["Canada","Chine","Russie","États-Unis"],c:2,f:""},
  {q:"Qui a peint La Nuit étoilée ?",a:["Claude Monet","Vincent van Gogh","Pablo Picasso","Salvador Dalí"],c:1,f:""},
  {q:"Quelle est la capitale du Canada ?",a:["Toronto","Vancouver","Ottawa","Montréal"],c:2,f:""},
  {q:"Combien de joueurs y a-t-il dans une équipe de football sur le terrain ?",a:["9","10","11","12"],c:2,f:""},
  {q:"Quel est le plus grand désert du monde ?",a:["Sahara","Antarctique","Gobi","Kalahari"],c:1,f:""},
  {q:"Qui a écrit Le Petit Prince ?",a:["Albert Camus","Antoine de Saint-Exupéry","Marcel Proust","Jules Verne"],c:1,f:""},
  {q:"Quelle planète est surnommée « la planète rouge » ?",a:["Mars","Vénus","Jupiter","Saturne"],c:0,f:""},
  {q:"Dans quel pays se trouve la ville de Dubaï ?",a:["Qatar","Arabie saoudite","Émirats arabes unis","Oman"],c:2,f:""},
  {q:"Qui a composé la Symphonie n°9 ?",a:["Johann Sebastian Bach","Wolfgang Amadeus Mozart","Ludwig van Beethoven","Frédéric Chopin"],c:2,f:""},
  {q:"Quel est le plus grand organe du corps humain ?",a:["Foie","Peau","Cerveau","Poumon"],c:1,f:""},
  {q:"Quel est le symbole chimique du fer ?",a:["Fe","Fr","F","Ir"],c:0,f:""},
  {q:"Quel océan borde la côte ouest de l'Europe ?",a:["Océan Pacifique","Océan Atlantique","Océan Indien","Océan Arctique"],c:1,f:""},
  {q:"Qui a réalisé le film Titanic ?",a:["Steven Spielberg","James Cameron","Christopher Nolan","Ridley Scott"],c:1,f:""},
  {q:"Quel est l'animal terrestre le plus rapide ?",a:["Lion","Guépard","Antilope","Tigre"],c:1,f:""},
  {q:"Dans quel pays est née la marque IKEA ?",a:["Finlande","Danemark","Suède","Norvège"],c:2,f:""},
  {q:"Qui a écrit Harry Potter à l'école des sorciers ?",a:["J. R. R. Tolkien","J. K. Rowling","Stephen King","George R. R. Martin"],c:1,f:""},
  {q:"Quelle est la capitale de l'Italie ?",a:["Milan","Venise","Florence","Rome"],c:3,f:""},
  {q:"Combien y a-t-il de côtés dans un hexagone ?",a:["5","6","7","8"],c:1,f:""},
  {q:"Quel gaz les plantes absorbent-elles principalement ?",a:["Oxygène","Azote","Dioxyde de carbone","Hydrogène"],c:2,f:""},
  {q:"Qui était le premier président des États-Unis ?",a:["Abraham Lincoln","George Washington","Thomas Jefferson","John Adams"],c:1,f:""},
  {q:"Quel est le plus haut sommet du monde ?",a:["K2","Mont Blanc","Mont Everest","Kilimandjaro"],c:2,f:""},
  {q:"Dans quel pays se trouve la ville de Rio de Janeiro ?",a:["Argentine","Brésil","Mexique","Pérou"],c:1,f:""},
  {q:"Quelle est la monnaie officielle du Royaume-Uni ?",a:["Euro","Dollar","Livre sterling","Couronne"],c:2,f:""},
  {q:"Qui a peint Guernica ?",a:["Pablo Picasso","Henri Matisse","Paul Cézanne","Edvard Munch"],c:0,f:""},
  {q:"Quelle est la capitale de l'Espagne ?",a:["Barcelone","Madrid","Valence","Séville"],c:1,f:""},
  {q:"Quel instrument possède généralement 88 touches ?",a:["Violon","Piano","Guitare","Trompette"],c:1,f:""},
  {q:"Quel est le plus grand mammifère du monde ?",a:["Éléphant","Requin blanc","Baleine bleue","Girafe"],c:2,f:""},
  {q:"Dans quel pays se trouve la ville de Bangkok ?",a:["Vietnam","Thaïlande","Cambodge","Laos"],c:1,f:""},
  {q:"Qui a inventé l'ampoule électrique moderne ?",a:["Nikola Tesla","Thomas Edison","Alexander Graham Bell","Benjamin Franklin"],c:1,f:""},
  {q:"Quel est le symbole chimique de l'or ?",a:["Ag","Au","Go","Or"],c:1,f:""},
],
music:[
  {q:"Quel groupe a chanté la chanson 'Bohemian Rhapsody' ?",a:["The Beatles","Queen","The Rolling Stones","Pink Floyd"],c:1,f:""},
  {q:"Quel chanteur est surnommé 'The King of Pop' ?",a:["Prince","Elvis Presley","Michael Jackson","Stevie Wonder"],c:2,f:""},
  {q:"Quel instrument possède généralement 6 cordes ?",a:["Violon","Guitare","Harpe","Piano"],c:1,f:""},
  {q:"Qui a composé la 9e symphonie ?",a:["Johann Sebastian Bach","Ludwig van Beethoven","Wolfgang Amadeus Mozart","Franz Schubert"],c:1,f:""},
  {q:"Quel groupe a chanté 'Hey Jude' ?",a:["The Rolling Stones","The Beatles","Queen","Oasis"],c:1,f:""},
  {q:"Quel chanteur a interprété 'Shape of You' ?",a:["Ed Sheeran","Justin Bieber","Shawn Mendes","Sam Smith"],c:0,f:""},
  {q:"Quel chanteur français est connu pour la chanson 'Je te promets' ?",a:["Florent Pagny","Jean-Jacques Goldman","Johnny Hallyday","Michel Sardou"],c:2,f:""},
  {q:"Dans quel pays est né Bob Marley ?",a:["États-Unis","Jamaïque","Royaume-Uni","Brésil"],c:1,f:""},
  {q:"Quel groupe a chanté 'Smells Like Teen Spirit' ?",a:["Nirvana","Metallica","Pearl Jam","Green Day"],c:0,f:""},
  {q:"Quel chanteur est célèbre pour 'Rocket Man' ?",a:["Elton John","David Bowie","Freddie Mercury","George Michael"],c:0,f:""},
  {q:"Qui chante 'Rolling in the Deep' ?",a:["Adele","Amy Winehouse","Dua Lipa","Sia"],c:0,f:""},
  {q:"Quel groupe a chanté 'Hotel California' ?",a:["Eagles","Fleetwood Mac","Aerosmith","Bon Jovi"],c:0,f:""},
  {q:"Quel groupe a chanté 'Viva La Vida' ?",a:["Coldplay","U2","Imagine Dragons","Muse"],c:0,f:""},
  {q:"Qui a chanté 'Like a Virgin' ?",a:["Madonna","Whitney Houston","Cyndi Lauper","Cher"],c:0,f:""},
  {q:"Quel groupe a chanté 'Wonderwall' ?",a:["Blur","Oasis","Radiohead","Arctic Monkeys"],c:1,f:""},
  {q:"Quel chanteur français est connu pour 'Formidable' ?",a:["Stromae","Orelsan","Vianney","Soprano"],c:0,f:""},
  {q:"Quel groupe a chanté 'We Will Rock You' ?",a:["Queen","AC/DC","Kiss","Bon Jovi"],c:0,f:""},
  {q:"Qui chante 'Bad Romance' ?",a:["Katy Perry","Lady Gaga","Rihanna","Beyoncé"],c:1,f:""},
  {q:"Quel groupe est connu pour 'Another Brick in the Wall' ?",a:["Pink Floyd","Deep Purple","Genesis","Yes"],c:0,f:""},
  {q:"Quel chanteur a interprété 'Someone Like You' ?",a:["Adele","Sam Smith","Lewis Capaldi","Ed Sheeran"],c:0,f:""},
  {q:"Dans quel pays est né Freddie Mercury ?",a:["Royaume-Uni","Inde","Tanzanie","États-Unis"],c:2,f:""},
  {q:"Quel groupe a chanté 'Sweet Child O' Mine' ?",a:["Guns N' Roses","Aerosmith","Metallica","Nirvana"],c:0,f:""},
],
cinema:[
  {q:"Qui a réalisé le film Titanic ?",a:["Steven Spielberg","James Cameron","Ridley Scott","Christopher Nolan"],c:1,f:""},
  {q:"Quel acteur joue Jack dans Titanic ?",a:["Brad Pitt","Leonardo DiCaprio","Tom Cruise","Matt Damon"],c:1,f:""},
  {q:"Dans quelle série trouve-t-on le personnage de Walter White ?",a:["Narcos","Breaking Bad","Better Call Saul","Ozark"],c:1,f:""},
  {q:"Qui joue Iron Man dans l'univers Marvel ?",a:["Chris Evans","Robert Downey Jr.","Chris Hemsworth","Mark Ruffalo"],c:1,f:""},
  {q:"Dans quelle série se déroule la lutte pour le trône de Westeros ?",a:["The Witcher","Game of Thrones","Vikings","House of the Dragon"],c:1,f:""},
  {q:"Quel acteur joue le Joker dans The Dark Knight ?",a:["Joaquin Phoenix","Jared Leto","Heath Ledger","Jack Nicholson"],c:2,f:""},
  {q:"Dans quelle série trouve-t-on les personnages Eleven et Mike ?",a:["Dark","Stranger Things","The Umbrella Academy","The OA"],c:1,f:""},
  {q:"Quel film raconte l'histoire d'un parc rempli de dinosaures ?",a:["King Kong","Jurassic Park","Godzilla","Avatar"],c:1,f:""},
  {q:"Qui joue le rôle de Harry Potter au cinéma ?",a:["Rupert Grint","Daniel Radcliffe","Tom Felton","Elijah Wood"],c:1,f:""},
  {q:"Quel acteur incarne Spider-Man dans les films du MCU récents ?",a:["Tobey Maguire","Andrew Garfield","Tom Holland","Timothée Chalamet"],c:2,f:""},
  {q:"Quel acteur joue Neo dans The Matrix ?",a:["Brad Pitt","Keanu Reeves","Tom Cruise","Johnny Depp"],c:1,f:""},
  {q:"Quel film met en scène un naufragé sur une île avec un ballon nommé Wilson ?",a:["Cast Away","Life of Pi","The Martian","The Beach"],c:0,f:""},
  {q:"Quel film raconte l'histoire d'un clown terrifiant nommé Pennywise ?",a:["The Conjuring","It","The Nun","Annabelle"],c:1,f:""},
  {q:"Quel acteur joue Wolverine dans les films X-Men ?",a:["Hugh Jackman","Chris Evans","Ryan Reynolds","Chris Pratt"],c:0,f:""},
  {q:"Quel film raconte l'histoire d'un homme qui revit la même journée sans cesse ?",a:["Groundhog Day","Edge of Tomorrow","Looper","Source Code"],c:0,f:""},
],
sport:[
  {q:"Combien de joueurs y a-t-il sur le terrain par équipe au football ?",a:["9","10","11","12"],c:2,f:""},
  {q:"Dans quel sport joue-t-on le tournoi de Wimbledon ?",a:["Tennis","Badminton","Squash","Ping-pong"],c:0,f:""},
  {q:"Dans quel sport évolue Michael Jordan ?",a:["Baseball","Basket-ball","Football américain","Hockey"],c:1,f:""},
  {q:"Dans quel sport utilise-t-on un ballon ovale ?",a:["Football","Rugby","Handball","Water-polo"],c:1,f:""},
  {q:"Combien de points vaut un panier à trois points au basket-ball ?",a:["1","2","3","4"],c:2,f:""},
  {q:"Combien de joueurs composent une équipe de basket-ball sur le terrain ?",a:["4","5","6","7"],c:1,f:""},
  {q:"Dans quel sport est célèbre Usain Bolt ?",a:["Natation","Athlétisme","Cyclisme","Football"],c:1,f:""},
  {q:"Combien de trous comporte un parcours classique de golf ?",a:["9","12","18","24"],c:2,f:""},
  {q:"Dans quel sport pratique-t-on le Tour de France ?",a:["Marathon","Cyclisme","Triathlon","Ski"],c:1,f:""},
  {q:"Dans quel sport est célèbre Roger Federer ?",a:["Tennis","Golf","Squash","Badminton"],c:0,f:""},
  {q:"Dans quel sport marque-t-on un 'touchdown' ?",a:["Baseball","Football américain","Rugby","Handball"],c:1,f:""},
  {q:"Dans quel sport est célèbre Lionel Messi ?",a:["Rugby","Football","Tennis","Basket"],c:1,f:""},
  {q:"Quel pays a remporté la FIFA World Cup 2018 ?",a:["Allemagne","Brésil","France","Argentine"],c:2,f:""},
],
histoire:[
  {q:"Qui était le premier empereur des Français ?",a:["Louis XIV","Napoleon Bonaparte","Louis XVI","Charles de Gaulle"],c:1,f:""},
  {q:"En quelle année a eu lieu la Révolution française ?",a:["1776","1789","1799","1815"],c:1,f:""},
  {q:"Quel mur a été détruit en 1989 ?",a:["Mur d'Hadrian","Mur de Berlin","Mur de Chine","Mur de Jéricho"],c:1,f:""},
  {q:"Quelle civilisation a construit les pyramides de Gizeh ?",a:["Grecs","Romains","Égyptiens","Perses"],c:2,f:""},
  {q:"En quelle année a commencé la Première Guerre mondiale ?",a:["1912","1914","1916","1918"],c:1,f:""},
  {q:"Quel explorateur a découvert l'Amérique en 1492 ?",a:["Vasco da Gama","Christophe Colomb","Ferdinand Magellan","James Cook"],c:1,f:""},
  {q:"En quelle année s'est terminée la Seconde Guerre mondiale ?",a:["1943","1944","1945","1946"],c:2,f:""},
  {q:"Qui était le chef de l'Allemagne nazie pendant la Seconde Guerre mondiale ?",a:["Adolf Hitler","Benito Mussolini","Joseph Staline","Francisco Franco"],c:0,f:""},
  {q:"En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?",a:["1965","1969","1971","1975"],c:1,f:""},
  {q:"Quelle bataille célèbre a marqué la défaite finale de Napoléon ?",a:["Austerlitz","Waterloo","Trafalgar","Leipzig"],c:1,f:""},
],
science:[
  {q:"Quelle planète est la plus proche du Soleil ?",a:["Vénus","Mercure","Terre","Mars"],c:1,f:""},
  {q:"Quel gaz les plantes absorbent-elles principalement pour la photosynthèse ?",a:["Oxygène","Dioxyde de carbone","Azote","Hydrogène"],c:1,f:""},
  {q:"Quel scientifique a formulé la théorie de la relativité ?",a:["Isaac Newton","Albert Einstein","Galileo Galilei","Nikola Tesla"],c:1,f:""},
  {q:"Quelle est la formule chimique de l'eau ?",a:["HO","H₂O","H₂O₂","OH"],c:1,f:""},
  {q:"Combien de planètes composent le système solaire ?",a:["7","8","9","10"],c:1,f:""},
  {q:"Quel organe du corps humain pompe le sang ?",a:["Poumon","Cerveau","Cœur","Foie"],c:2,f:""},
  {q:"Quel scientifique a découvert la gravitation ?",a:["Isaac Newton","Albert Einstein","Marie Curie","Galileo Galilei"],c:0,f:""},
  {q:"Quelle est l'étoile la plus proche de la Terre ?",a:["Proxima Centauri","Sirius","Le Soleil","Alpha Centauri"],c:2,f:""},
  {q:"Quelle planète possède les anneaux les plus visibles ?",a:["Jupiter","Saturne","Uranus","Neptune"],c:1,f:""},
  {q:"Quelle est la vitesse approximative de la lumière dans le vide ?",a:["3 000 km/s","30 000 km/s","300 000 km/s","3 000 000 km/s"],c:2,f:""},
],
geo:[
  {q:"Quelle est la capitale de la France ?",a:["Lyon","Marseille","Paris","Toulouse"],c:2,f:""},
  {q:"Quel est le plus grand océan de la planète ?",a:["Atlantique","Indien","Pacifique","Arctique"],c:2,f:""},
  {q:"Quel est le plus grand désert du monde (chaud) ?",a:["Gobi","Kalahari","Sahara","Arabie"],c:2,f:""},
  {q:"Quel fleuve traverse la ville de Londres ?",a:["Rhin","Tamise","Danube","Seine"],c:1,f:""},
  {q:"Quel est le plus grand pays du monde par superficie ?",a:["Canada","Chine","Russie","États-Unis"],c:2,f:""},
  {q:"Quelle chaîne de montagnes sépare la France et l'Espagne ?",a:["Alpes","Pyrénées","Carpates","Apennins"],c:1,f:""},
  {q:"Quelle est la capitale du Japon ?",a:["Osaka","Kyoto","Tokyo","Nagoya"],c:2,f:""},
  {q:"Quel est le plus long fleuve du monde ?",a:["Amazone","Nil","Yangtsé","Mississippi"],c:1,f:""},
  {q:"Quel est le plus haut sommet du monde ?",a:["K2","Mont Everest","Kangchenjunga","Mont Blanc"],c:1,f:""},
  {q:"Quel pays a la forme d'une botte ?",a:["Espagne","Italie","Portugal","Grèce"],c:1,f:""},
],
gaming:[
  {q:"Quel personnage est le héros principal de la série Super Mario Bros. ?",a:["Luigi","Mario","Bowser","Toad"],c:1,f:""},
  {q:"Dans quel jeu trouve-t-on le personnage de Link ?",a:["Final Fantasy VII","The Legend of Zelda","Dragon Quest","Monster Hunter"],c:1,f:""},
  {q:"Quel jeu de Mojang Studios consiste à construire avec des blocs dans un monde ouvert ?",a:["Terraria","Minecraft","Roblox","Fortnite"],c:1,f:""},
  {q:"Quelle entreprise a créé la console PlayStation ?",a:["Nintendo","Microsoft","Sony","Sega"],c:2,f:""},
  {q:"Quel est le rival principal de Mario dans les jeux Nintendo ?",a:["Yoshi","Bowser","Wario","Donkey Kong"],c:1,f:""},
  {q:"Quel personnage est la mascotte de Sega ?",a:["Mario","Sonic","Crash","Kirby"],c:1,f:""},
  {q:"Quelle entreprise développe la série Grand Theft Auto ?",a:["Ubisoft","Rockstar Games","Electronic Arts","Square Enix"],c:1,f:""},
  {q:"Quel jeu consiste à capturer des créatures et les faire combattre ?",a:["Digimon World","Pokémon","Monster Hunter","Palworld"],c:1,f:""},
  {q:"Dans quel jeu trouve-t-on le personnage Master Chief ?",a:["Halo","Destiny","Mass Effect","Doom"],c:0,f:""},
  {q:"Quel jeu de course met en scène Mario et ses amis ?",a:["Forza Horizon","Gran Turismo","Mario Kart","Need for Speed"],c:2,f:""},
],
hp:[
  {q:"Dans quelle maison est Harry ?",a:["Serdaigle","Serpentard","Gryffondor","Poufsouffle"],c:2,f:""},
  {q:"Quel est le prénom du professeur Dumbledore ?",a:["Albert","Albus","Adrian","Arthur"],c:1,f:""},
  {q:"Quel est le sport joué sur balais volants ?",a:["Bludger","Quidditch","Nimbus","Cognard"],c:1,f:""},
  {q:"Comment s'appelle la banque des sorciers ?",a:["Gringotts","Ollivander","Azkaban","Durmstrang"],c:0,f:""},
  {q:"Quel est le prénom du meilleur ami masculin de Harry ?",a:["Ron","Fred","Percy","George"],c:0,f:""},
  {q:"Quel professeur enseigne les potions lors des premiers livres ?",a:["Lupin","Rogue","McGonagall","Flitwick"],c:1,f:""},
  {q:"Comment s'appelle l'elfe de maison ami de Harry ?",a:["Kreattur","Dobby","Winky","Hokey"],c:1,f:""},
  {q:"Quel est le nom de la prison des sorciers ?",a:["Durmstrang","Azkaban","Beauxbâtons","Godric's Hollow"],c:1,f:""},
  {q:"Quel objet Harry reçoit-il de son père ?",a:["Une baguette","Une cape d'invisibilité","Un balai","Une carte magique"],c:1,f:""},
  {q:"Quel monstre vit dans la Chambre des Secrets ?",a:["Un basilic","Un dragon","Un troll","Un hippogriffe"],c:0,f:""},
  {q:"Quel sort sert à désarmer un adversaire ?",a:["Expelliarmus","Lumos","Stupefix","Alohomora"],c:0,f:""},
  {q:"Quel est le nom complet de Voldemort ?",a:["Tom Elvis Jedusor","Tom Marvolo Jedusor","Tom Marcus Jedusor","Tom Magnus Jedusor"],c:1,f:""},
],
};

// ── Pioche de questions aléatoires ──
// themeIds : tableau de thèmes (ex: ["culture","sport"])
// count    : nombre de questions à piocher
function getStaticQs(themeIds, count) {
  if (!Array.isArray(themeIds) || !themeIds.length) themeIds = ["culture"];

  // Construire le pool en excluant les questions déjà posées
  let pool = [];
  themeIds.forEach(tid => {
    const qs = (QUESTIONS[tid] || []).filter(q => !USED_QS.has(q.q));
    pool = pool.concat(qs);
  });
  pool.sort(() => Math.random() - .5);

  // Si pas assez de questions → reset et recommence
  if (pool.length < count) {
    themeIds.forEach(tid => { (QUESTIONS[tid] || []).forEach(q => USED_QS.delete(q.q)); });
    pool = [];
    themeIds.forEach(tid => { pool = pool.concat(QUESTIONS[tid] || []); });
    pool.sort(() => Math.random() - .5);
  }

  pool.slice(0, count).forEach(q => USED_QS.add(q.q));
  return pool.slice(0, count);
}
