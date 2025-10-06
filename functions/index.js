// ==========================
// index.js - Firebase v2 (Email FISSA con deduplicazione + Schedulazione messaggi)
// ==========================
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

// Inizializza Firebase Admin
initializeApp();
const db = getFirestore();

const POSITIVE_MORNING = [
 "Si è svegliato in perfetto orario. La sveglia è stata rispettata al secondo: occhi aperti, si alza dal letto e inizia la giornata senza rimandare. È pronto a trasformare subito le prime ore in azioni concrete.",
"Si è svegliato puntuale, ha spento la sveglia al primo suono e si è alzato senza esitazioni. Adesso ha davanti a sé tutta la mattina per iniziare con energia.",
"Sono le 07:30 e ha appena aperto gli occhi, in orario perfetto. Senza perdere tempo, si è messo in piedi: la giornata parte con la giusta disciplina, pronto a non sprecare nemmeno un minuto.",
"Si è alzato alle 05:00 e ha passato due ore a lavorare sul suo obiettivo con concentrazione assoluta. Ora che sono le 07:30 ha già completato una parte significativa del progetto, e continua a spingere.",
"Alle 04:30 era già operativo: ha usato le prime ore del mattino per chiudere una micro-attività rimasta indietro. Adesso, alle 07:30, procede con il compito principale con un vantaggio enorme.",
"Ha deciso di anticipare la sveglia alle 05:00, ha bevuto un caffè e si è messo subito al lavoro. Ora che sono le 07:30 è già dentro al flusso, con due ore di attività intensa alle spalle.",
"Alle 04:00 era già in piedi: ha lavorato in silenzio mentre tutti dormivano, sfruttando tre ore di assoluta concentrazione. Adesso, alle 07:30, ha già macinato risultati concreti.",
"Si è svegliato in perfetto orario. Alle 07:30 si trova pronto, con la lista già davanti: inizia subito il primo compito senza dover pensare a nulla.",
"Alle 07:30 è già sul pezzo: ha aperto il documento giusto, disattivato ogni distrazione e impostato il timer per il primo ciclo di lavoro. La giornata è partita senza perdere tempo.",
"Alle 07:30 si è svegliato in perfetto orario. Non ha toccato il telefono, si è alzato subito e ora è pronto a iniziare la giornata con la mente libera.",
"Si è alzato alle 05:00 e ha passato due ore a concentrarsi sul lavoro più importante. Adesso, alle 07:30, è già immerso nella seconda parte del suo obiettivo.",
"Alle 07:30 ha aperto gli occhi senza esitazioni, si è alzato e si è messo in movimento. La mattina comincia senza ritardi, con la giusta disciplina.",
"Sveglia alle 04:30, un bicchiere d’acqua e tre ore di lavoro intenso. Ora che sono le 07:30, ha già concluso la prima fase della giornata e procede deciso.",
"Sono le 07:30 e si è appena alzato in orario perfetto: niente scuse, solo la determinazione di sfruttare subito il tempo.",
"Ha deciso di svegliarsi alle 05:00 e ha lavorato per oltre due ore senza distrazioni. Alle 07:30 è già avanti rispetto a chi si deve ancora organizzare.",
"Alle 07:30 ha rispettato la sveglia e si è messo subito in piedi. L’energia del mattino lo spinge ad affrontare con decisione la prima attività.",
"Si è alzato alle 04:00 e ha già trascorso tre ore a concentrarsi sul suo obiettivo. Alle 07:30 continua con costanza, costruendo un vantaggio enorme.",
"Alle 07:30 si è svegliato puntuale, senza rimandare. È già seduto al suo posto, con la testa pronta per iniziare subito la giornata.",
"Ha aperto gli occhi alle 05:00, si è messo al lavoro e non ha perso un minuto. Alle 07:30 è già in piena attività, determinato a mantenere il ritmo.",
"Alle 07:30 si è svegliato senza esitazioni, ha spento la sveglia e si è alzato subito. È pronto a trasformare la prima ora della giornata in lavoro reale.",
"Si è alzato alle 05:00 e ha iniziato a lavorare concentrato. Ora che sono le 07:30, sta già concludendo la seconda attività della mattina.",
"Alle 07:30 è scattato dal letto puntuale. La giornata parte subito con disciplina: niente attese, ha già preso posizione al suo posto di lavoro.",
"Si è svegliato alle 04:30, ha acceso il computer e ha lavorato tre ore in silenzio. Alle 07:30 prosegue con determinazione, senza pause.",
"Alle 07:30 si è alzato senza rimandare la sveglia. È pronto a dare subito un colpo deciso all’obiettivo.",
"Alle 05:00 era già operativo: due ore intense dedicate al compito principale. Ora che sono le 07:30, continua con la stessa energia.",
"Alle 07:30 ha rispettato l’orario stabilito e si è alzato senza scuse. Inizia la giornata con la mente lucida e la volontà di non perdere un minuto.",
"Alle 04:00 si è svegliato e ha usato tre ore di silenzio assoluto per lavorare. Alle 07:30 è già avanti, saldo nel suo ritmo.",
"Alle 07:30 è scattato in piedi al primo suono della sveglia. Niente pigrizia: parte subito per affrontare i primi passi concreti della giornata.",
"Si è svegliato alle 05:00 e si è messo subito in azione. Ora, alle 07:30, è già immerso nel cuore del lavoro.",
"Alle 07:30 si è alzato senza esitazioni, ha appoggiato i piedi a terra e ha deciso di iniziare la giornata con fermezza. Nessun ritardo: è già pronto a fare il primo passo concreto verso l’obiettivo."
];

const NEGATIVE_MORNING = [
"Alle 07:30 non si è ancora alzato: la sveglia ha suonato più volte, ma continua a rimandare. La mattina è già scivolata via senza iniziare.",
"Aveva deciso di svegliarsi alle 06:00 per lavorare, ma ha rimandato. Ora sono le 07:30 e ha già perso oltre un’ora girandosi nel letto.",
"Alle 07:30 è ancora fermo: invece di alzarsi al primo suono, ha lasciato che la pigrizia prendesse il controllo.",
"La sveglia è suonata alle 06:00 e poi di nuovo alle 07:00, ma l’ha silenziata ogni volta. Alle 07:30 non ha ancora mosso un passo verso l’obiettivo.",
"Alle 07:30 è già in ritardo: avrebbe dovuto essere in piedi alle 05:00 per iniziare, ma ha preferito restare a letto.",
"Sono le 07:30 e sta già sprecando tempo con il telefono, scrollando i social invece di iniziare.",
"Alle 07:30 non ha ancora iniziato nulla: si è svegliato svogliato e non trova la forza di mettersi in moto.",
"Aveva promesso di alzarsi presto, ma alle 07:30 è ancora in difetto: non ha fatto nemmeno la prima azione minima.",
"La sveglia ha suonato alle 06:00, ma ha scelto di restare sotto le coperte. Alle 07:30 non ha ancora fatto nessun passo avanti.",
"Alle 07:30 è sveglio, ma senza energia: ha acceso lo schermo del telefono e ha perso i primi minuti in distrazioni inutili.",
"Alle 07:30 non ha rispettato i suoi piani: aveva puntato la sveglia alle 05:30 per iniziare presto, ma è rimasto a letto più del dovuto.",
"La sveglia ha suonato alle 06:00, ma invece di alzarsi ha perso tempo fissando il soffitto. Ora sono le 07:30 e non ha ancora iniziato.",
"Sono le 07:30 e non ha ancora mosso un passo: la pigrizia ha avuto la meglio.",
"Alle 07:30 si è alzato, ma ha passato subito i primi minuti sul telefono senza fare nulla di utile.",
"Alle 07:30 è già in difetto: avrebbe potuto cominciare alle 06:00, ma non ha avuto la disciplina di alzarsi subito.",
"Ha impostato la sveglia alle 06:00, ma l’ha spenta e ha deciso di restare sotto le coperte. Alle 07:30 è ancora fermo.",
"Alle 07:30 è sveglio, ma non si è ancora alzato: ha perso tempo a rigirarsi nel letto.",
"Sono le 07:30 e invece di iniziare la giornata ha scelto di rimandare ancora.",
"Alle 07:30 non ha ancora toccato il suo obiettivo: i minuti stanno passando senza nessun progresso.",
"Alle 07:30 è sveglio, ma ha iniziato la giornata con distrazioni inutili: zero azioni concrete fino ad ora.",
"Alle 07:30 la sveglia ha suonato, ma ha scelto di restare a letto. Nessun passo avanti, solo tempo perso.",
"Aveva deciso di svegliarsi alle 05:00, ma alle 07:30 è ancora con la testa sul cuscino, senza la forza di iniziare.",
"La sveglia ha suonato più volte, ma ha preferito ignorarla. Ora sono le 07:30 e non ha fatto alcun progresso.",
"Alle 07:30 si è svegliato, ma si è lasciato subito trascinare da pensieri inutili invece di agire.",
"Sono le 07:30 e ha già iniziato male: ha acceso il telefono e si è perso tra notifiche e social.",
"Alle 07:30 non ha fatto nulla: è sveglio, ma resta immobile, senza la decisione di alzarsi.",
"Aveva promesso di alzarsi alle 05:30, ma alle 07:30 è ancora fermo. La mattina è già sprecata.",
"Alle 07:30 la sveglia è stata silenziata più volte. La giornata comincia con indecisione e ritardo.",
"Sono le 07:30 e invece di iniziare ha già scelto la via più comoda: restare fermo.",
"Alle 07:30 è ancora lontano dall’obiettivo: ha perso due ore che voleva dedicare al lavoro mattutino."
];

const POSITIVE_AFTERNOON = [
  "Dopo pranzo non si è lasciato trascinare dalla sonnolenza: ha fatto una pausa breve e ora è di nuovo in azione.",
"Ha reagito al calo di energie del primo pomeriggio: invece di cedere, ha ripreso con costanza.",
"Mentre altri si sarebbero fermati, lui ha trovato la forza per continuare e andare avanti.",
"Ha usato queste ore per sistemare piccole cose rimaste in sospeso: segni concreti che fanno la differenza.",
"Il primo pomeriggio non lo ha rallentato: sta trasformando la stanchezza in disciplina.",
"Ha scelto di non rimandare: ha ripreso subito dopo pranzo e adesso mantiene il ritmo.",
"Ha trovato il modo di ricaricare le energie e sta continuando con determinazione.",
"Il momento di calo è arrivato, ma non ha ceduto: ha fatto un passo avanti invece di fermarsi.",
"Ha trasformato un’ora spesso improduttiva in tempo usato bene.",
"Dopo pranzo ha scelto la via della disciplina: continua a muoversi senza perdere terreno.",
"Dopo pranzo ha concesso solo il tempo necessario per recuperare energie, poi si è rimesso in movimento. Alle 15:30 è attivo, con il ritmo giusto per portare avanti la giornata.",
"La stanchezza si è fatta sentire, ma non l’ha fermato: ha scelto di rialzarsi subito e di continuare. Ora, alle 15:30, sta dimostrando a sé stesso che la costanza paga.",
"Il primo pomeriggio poteva trasformarsi in un momento vuoto, invece è diventato produttivo: alle 15:30 sta già svolgendo azioni concrete che segnano la differenza.",
"Ha ripreso il filo senza esitazioni: una pausa breve per ricaricarsi e adesso, alle 15:30, procede con passo costante.",
"Alle 15:30 non è rimasto fermo, ha trovato la forza di continuare. La disciplina lo guida e il pomeriggio è già segnato da progressi reali.",
"Si è rialzato senza rimandare: ora, alle 15:30, è immerso in ciò che serve davvero, dimostrando determinazione e presenza.",
"Ha superato il momento più difficile del post-pranzo e ha scelto di andare avanti. Alle 15:30 il tempo non è sprecato, ma trasformato in azioni concrete.",
"Alle 15:30 il suo percorso non si è interrotto: ha trovato l’energia per continuare e portare avanti ciò che conta.",
"Nonostante il calo di energie, ha deciso di reagire subito. Ora, alle 15:30, sta usando la sua forza di volontà per restare in movimento.",
"Il pomeriggio è iniziato con disciplina: senza lasciarsi fermare, alle 15:30 continua a fare passi reali verso ciò che vuole.",
"Ha trasformato il primo pomeriggio in un momento utile: alle 15:30 è già impegnato a dare continuità alla giornata senza interruzioni inutili.",
"Alle 15:30 non si è fatto trascinare dalla lentezza tipica di quest’ora: ha mantenuto il passo e continua con costanza.",
"Il dopo pranzo non è diventato un ostacolo: si è rimesso in moto e alle 15:30 sta già andando avanti con determinazione.",
"Ha scelto di restare attivo anche quando le energie potevano calare. Alle 15:30 è saldo sul percorso che ha deciso di seguire.",
"Alle 15:30 la sua giornata non conosce pause eccessive: ha ripreso subito in mano ciò che conta e lo porta avanti con regolarità.",
"Ha dato ritmo al pomeriggio senza rimandare: alle 15:30 è concentrato e non lascia spazio all’inerzia.",
"Il tempo dopo pranzo è stato usato con intelligenza: alle 15:30 prosegue senza perdere l’equilibrio che si è costruito.",
"Alle 15:30 il suo cammino non si è fermato. La disciplina ha preso il posto della stanchezza e lo guida a continuare.",
"Ha gestito al meglio la ripresa del pomeriggio: alle 15:30 sta dimostrando di avere costanza e fermezza.",
"Alle 15:30 il suo impegno non vacilla: ha scelto di restare attivo e il tempo scorre a suo favore."
];

const NEGATIVE_AFTERNOON = [
  "Il pranzo si è trasformato in una scusa: alle 15:30 non ha ancora ripreso nulla e il tempo sta già scivolando via.",
"Alle 15:30 è ancora fermo, intrappolato nella stanchezza che avrebbe dovuto superare.",
"La pausa dopo pranzo si è allungata troppo: alle 15:30 non ha compiuto nemmeno un’azione concreta.",
"Invece di rimettersi in moto, alle 15:30 è rimasto a rimandare, lasciando andare via minuti preziosi.",
"Alle 15:30 non ha ancora trovato la forza di alzarsi dalla comodità in cui si è rifugiato.",
"Il pomeriggio è già iniziato male: alle 15:30 non ha ripreso nulla e l’inerzia lo domina.",
"La stanchezza post-pranzo ha vinto: alle 15:30 non è riuscito a reagire e resta immobile.",
"Alle 15:30 il tempo è già perso: invece di fare un passo avanti, è rimasto a indugiare senza agire.",
"Ha lasciato che la pausa diventasse un ostacolo: alle 15:30 non ha ancora ricominciato.",
"Il primo pomeriggio non porta progressi: alle 15:30 non ha mosso un dito e continua a rinviare.",
"Alle 15:30 non ha ancora trovato la spinta per ripartire: il tempo scorre senza risultati.",
"Il primo pomeriggio è rimasto vuoto: alle 15:30 non ha fatto nulla di utile.",
"La pausa si è trasformata in inattività: alle 15:30 non c’è ancora stato alcun segnale di movimento.",
"Alle 15:30 non ha reagito al calo di energie e si è lasciato bloccare dalla pigrizia.",
"Il pomeriggio è iniziato senza ritmo: alle 15:30 non ha ancora ripreso nulla di concreto.",
"Alle 15:30 il tempo è scivolato via tra indecisioni e piccoli rinvii.",
"Ha lasciato che la sonnolenza avesse la meglio: alle 15:30 non c’è ancora stata alcuna azione.",
"Alle 15:30 la giornata segna un vuoto: non ha ripreso in mano ciò che aveva lasciato in sospeso.",
"Il primo pomeriggio non porta progressi: alle 15:30 è fermo nello stesso punto.",
"Alle 15:30 il suo tempo è rimasto sospeso tra intenzioni e mancanza di azione.",
"Alle 15:30 non ha ancora trovato la decisione di rimettersi in moto: il tempo si è consumato senza progressi.",
"Il pomeriggio è iniziato con inerzia: alle 15:30 non ha fatto alcun passo concreto.",
"Alle 15:30 è rimasto bloccato dalla pigrizia, lasciando che la giornata perda ritmo.",
"Il dopo pranzo è stato sprecato: alle 15:30 non ha ripreso nulla e resta fermo.",
"Alle 15:30 la pausa si è trasformata in immobilità, senza nessuna azione significativa.",
"Il calo di energie non è stato superato: alle 15:30 la giornata è ancora ferma.",
"Alle 15:30 non ha mosso un dito, lasciando scorrere minuti che potevano essere usati meglio.",
"La ripresa non è arrivata: alle 15:30 è ancora fermo nello stesso punto del pranzo.",
"Alle 15:30 il tempo si è perso in esitazioni, senza nessuna scelta chiara.",
"Il pomeriggio non ha preso forma: alle 15:30 non c’è stato alcun passo avanti."
];

const POSITIVE_EVENING = [
 "Alle 21:30 è ancora concentrato: ha scelto di chiudere la giornata con un ultimo sforzo produttivo.",
"La giornata si conclude bene: alle 21:30 ha deciso di rilassarsi dopo aver portato a termine ciò che si era promesso.",
"Alle 21:30 è davanti a un ultimo impegno, dimostrando costanza fino alla fine della giornata.",
"Ha completato le attività principali e alle 21:30 si concede il meritato riposo.",
"Alle 21:30 ha scelto di prendersi un momento di svago: un film, un libro o un po’ di relax per ricaricare le energie.",
"La sera non è stata sprecata: alle 21:30 ha fatto ancora qualcosa di utile prima di rallentare.",
"Alle 21:30 ha chiuso la giornata con soddisfazione, avendo rispettato i passi che si era prefissato.",
"Nonostante l’orario, alle 21:30 è rimasto attivo e ha dato l’ultima spinta.",
"Ha deciso di concludere la giornata in equilibrio: un po’ di lavoro e un po’ di riposo, così alle 21:30 si sente in pace.",
"Alle 21:30 ha staccato senza sensi di colpa: ha fatto la sua parte e ora si dedica al relax serale.",
"Alle 21:30 ha ancora energia e la usa per portare a termine un piccolo compito rimasto in sospeso.",
"Ha scelto di non chiudere la giornata di fretta: alle 21:30 sta dedicando tempo a ciò che conta per lui.",
"Alle 21:30 non si è fermato: sta concludendo con disciplina l’ultimo impegno della giornata.",
"Ha deciso di premiarsi: alle 21:30 si rilassa con uno svago meritato dopo una giornata di azioni concrete.",
"Alle 21:30 si concede un momento di tranquillità, sapendo di aver fatto quanto serviva.",
"La sera non è andata sprecata: alle 21:30 ha scelto di restare coerente con il suo impegno.",
"Alle 21:30 ha spento le distrazioni e ha dato ancora un po’ di tempo a ciò che lo avvicina ai suoi obiettivi.",
"Ha mantenuto il ritmo fino alla fine: alle 21:30 sta chiudendo la giornata con determinazione.",
"Alle 21:30 non si sente in colpa a riposare, perché sa di aver già fatto la sua parte.",
"Ha trasformato l’ultima parte della giornata in un momento utile: alle 21:30 si dedica con equilibrio a lavoro e relax.",
"Alle 21:30 sta ancora dedicando attenzione a ciò che ritiene importante, chiudendo la giornata con costanza.",
"La sera si conclude con disciplina: alle 21:30 porta avanti un ultimo gesto concreto.",
"Alle 21:30 ha deciso di fermarsi e concedersi relax, sapendo di aver speso bene le ore precedenti.",
"Ha scelto di non sprecare l’ultima parte della giornata: alle 21:30 continua a dare valore al suo tempo.",
"Alle 21:30 trova equilibrio: un po’ di impegno e un po’ di riposo per concludere la giornata senza rimpianti.",
"La giornata non finisce senza azione: alle 21:30 si dedica con attenzione a un’ultima attività.",
"Alle 21:30 si sente soddisfatto: ha mantenuto il ritmo fino a sera e può permettersi di rallentare.",
"Ha usato la sera per restare attivo: alle 21:30 completa ciò che aveva deciso senza lasciarlo a domani.",
"Alle 21:30 si regala un momento sereno, perché la costanza di oggi gli permette di staccare senza sensi di colpa.",
"La giornata si chiude con ordine: alle 21:30 ha dato spazio sia al dovere che al relax."
];

const NEGATIVE_EVENING = [
  "Alle 21:30 non ha trovato la forza di muoversi: è rimasto immobile a rimandare anche l’ultima occasione di agire.",
"Ha lasciato che la stanchezza prendesse il controllo: alle 21:30 è fermo senza iniziare nulla.",
"Alle 21:30 si è perso dietro al telefono, senza rendersi conto di quanto tempo stia scivolando via.",
"La sera è arrivata e alle 21:30 non ha fatto altro che sedersi senza concludere niente di concreto.",
"Alle 21:30 avrebbe potuto fare ancora qualcosa, ma ha preferito non muoversi.",
"Si è lasciato catturare dalle distrazioni: alle 21:30 è fermo davanti allo schermo, senza disciplina.",
"Alle 21:30 non ha preso nessuna iniziativa: si è rifugiato nell’inattività.",
"La sera non porta movimento: alle 21:30 è rimasto bloccato in gesti automatici e vuoti.",
"Alle 21:30 la pigrizia ha vinto: non ha dato spazio a nessuna azione concreta.",
"È arrivata la sera e alle 21:30 si è rifugiato solo nello svago, dimenticando qualsiasi passo avanti.",
"Alle 21:30 si è lasciato andare alla comodità del divano, senza nemmeno provare a restare attivo.",
"La sera è arrivata e alle 21:30 si è rifugiato in distrazioni inutili, senza disciplina.",
"Alle 21:30 si è chiuso in un’abitudine sterile: scrollare lo schermo senza alcun controllo.",
"Ha scelto di non muoversi: alle 21:30 rimane fermo, senza alcun segnale di iniziativa.",
"Alle 21:30 la sera lo trova stanco e disattento, più interessato a passare il tempo che a usarlo bene.",
"Si è lasciato vincere dall’apatia: alle 21:30 è immobile, senza azioni da ricordare.",
"Alle 21:30 la sua unica scelta è stata spegnersi davanti a uno svago vuoto.",
"Il tempo serale scorre lento: alle 21:30 non c’è nessun movimento, solo passività.",
"Alle 21:30 non ha saputo reagire: la sera è rimasta priva di qualsiasi iniziativa concreta.",
"Ha lasciato che la sera lo trascinasse in inerzia: alle 21:30 è fermo, senza disciplina.",
"Alle 21:30 è ancora con lo sguardo fisso sullo schermo, senza alcun proposito concreto.",
"La sera avanza e alle 21:30 si è già lasciato trascinare dalla pigrizia.",
"Alle 21:30 non ha trovato stimoli: si è rifugiato in gesti automatici che non lo portano da nessuna parte.",
"Il tempo serale si è spento in fretta: alle 21:30 non ha acceso nessuna azione utile.",
"Alle 21:30 si è abbandonato a una passività totale, senza reazioni.",
"La sera lo trova immobile: alle 21:30 non ha fatto altro che sedersi e lasciar passare il tempo.",
"Alle 21:30 si è adagiato nella comodità, scegliendo il percorso più facile e vuoto.",
"Ha lasciato che la sera si svuotasse: alle 21:30 non c’è traccia di iniziativa.",
"Alle 21:30 il suo unico impegno è stato spegnersi davanti a un passatempo privo di senso.",
"La sera non lo vede attivo: alle 21:30 è prigioniero dell’inerzia."
];

function buildMessage(slot) {
  let positives = [];
  let negatives = [];

  if (slot === "morning") {
    positives = POSITIVE_MORNING;
    negatives = NEGATIVE_MORNING;
  }
  if (slot === "afternoon") {
    positives = POSITIVE_AFTERNOON;
    negatives = NEGATIVE_AFTERNOON;
  }
  if (slot === "evening") {
    positives = POSITIVE_EVENING;
    negatives = NEGATIVE_EVENING;
  }

  // Unisco tutte le frasi
  const list = [...positives, ...negatives];
  const randomIndex = Math.floor(Math.random() * list.length);
  const text = list[randomIndex];

  // Decido il tipo
  const type = positives.includes(text) ? "positive" : "negative";

  return { text, type };
}

// 🔹 Config da variabili d’ambiente
const gmailUser = process.env.GMAIL_USER || "";
const gmailPass = process.env.GMAIL_PASS || "";

// 🔹 Nodemailer (Email)
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: { user: gmailUser, pass: gmailPass },
});

// =====================================
// 1. Invio Email quando viene creato un nuovo Messaggio
// =====================================
exports.notifyOnNewMessage = onDocumentCreated(
  {
    document: "Experiences/{expId}/Messages/{msgId}",
    secrets: ["GMAIL_USER", "GMAIL_PASS"],
  },
  async (event) => {
    const msg = event.data.data();
    const expId = event.params.expId;

     // 👇 Ignora i messaggi introduttivi
    if (msg.slot === "intro") {
      console.log("⏩ Messaggio introduttivo, niente email:", msg.text);
      return;
    }

    // Considera solo morning, afternoon, evening
    if (!["morning", "afternoon", "evening"].includes(msg.slot)) {
      console.log("⏩ Ignoro slot non valido:", msg.slot);
      return;
    }

    try {
      // Recupera dati esperienza
      const expDoc = await db.collection("Experiences").doc(expId).get();
      if (!expDoc.exists) {
        console.log("❌ Esperienza non trovata:", expId);
        return;
      }

      const { canale, contatto, nomeUtente } = expDoc.data();
      if (canale !== "email" || !contatto) {
        console.log("ℹ️ Nessuna email richiesta per:", expId);
        return;
      }

      // 🔹 Deduplicazione: 1 email per slot al giorno
      const today = new Date().toISOString().substring(0, 10); // es: "2025-10-04"
      const logId = `${msg.slot}_${today}`;
      const logRef = db
        .collection("Experiences")
        .doc(expId)
        .collection("EmailLog")
        .doc(logId);

      const logDoc = await logRef.get();
      if (logDoc.exists) {
        console.log(`⏩ Email già inviata oggi per slot ${msg.slot}`);
        return;
      }

      // 🔹 Invia email con aggiornamento sfidante
await mailer.sendMail({
  from: `"Il Narratore" <${gmailUser}>`,
  to: contatto,
  subject: "📩 Nuovo aggiornamento sul tuo Sfidante",
  html: `
   <h2>Ciao!</h2>
<p>È arrivato un nuovo aggiornamento rispetto a ciò che il tuo Sfidante sta facendo in questo momento della giornata.</p>
<p>Vuoi scoprire se sta avanzando o se si è fermato? Accedi subito al sito e leggi il messaggio appena generato:</p>
<p>
  <a href="https://sensazioniemotivazione.com/la-gara-contro-il-tempo"
     style="display:inline-block;
            padding:12px 20px;
            background:#39ff14;
            color:#000;
            font-weight:bold;
            text-decoration:none;
            border-radius:8px;
            font-family:Arial, sans-serif;">
    🔗 Vai al sito
  </a>
</p>
<br>
<p>Trasforma ogni aggiornamento in un’occasione per muoverti anche tu 🚀</p>
<p>— Il Narratore</p>
<hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
<p style="font-size:12px; color:#555; font-family:Arial, sans-serif;">
  ℹ️ Nel caso desiderassi bloccare le notifiche, basta accedere alla tua esperienza sul sito e schiacciare il tasto:<br>
  <strong>🔕 Non voglio più ricevere notifiche</strong>.<br>
  Potrai riattivarle in qualsiasi momento seguendo la stessa procedura.
</p>
  `,
});

      // 🔹 Segna nel log che è stata inviata
      await logRef.set({
        sentAt: new Date(),
        slot: msg.slot,
      });

      console.log(`📧 Email inviata a ${contatto} per slot ${msg.slot}`);
    } catch (err) {
      console.error("Errore nell’invio email:", err);
    }
  }
);

// =====================================
// 2. Generazione Automatica Messaggi (anche con sito chiuso)
// =====================================
async function creaMessaggio(slot, label, ordine, ora, min) {
  const today = new Date().toISOString().split("T")[0];
  const orario = `${String(ora).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

  // Recupera tutte le esperienze attive
  const snap = await db.collection("Experiences")
    .where("stato", "==", "attiva")
    .get();

  // Array di promesse
  const ops = [];

  for (const doc of snap.docs) {
    const expRef = doc.ref.collection("Messages");

    // 🔹 Genera messaggio separato per ogni esperienza
    const { text, type } = buildMessage(slot);

    ops.push(
      expRef.add({
        slot,
        label,
        type,     // "positive" o "negative"
        text,     // la frase scelta
        ordine,
        orario,
        date: today,
        autore: "Sfidante",
        timestamp: FieldValue.serverTimestamp()
      })
    );
  }

  // Aspetta tutte le scritture insieme
  await Promise.all(ops);
}

// Mattina 07:30 Europe/Rome -> 05:30 UTC
exports.generateMorning = onSchedule("30 5 * * *", async () => {
  await creaMessaggio("morning", "Mattina", 6, 7, 30);
});

// Pomeriggio 15:30 Europe/Rome -> 13:30 UTC
exports.generateAfternoon = onSchedule("30 13 * * *", async () => {
  await creaMessaggio("afternoon", "Pomeriggio", 7, 15, 30);
});

// Sera 21:30 Europe/Rome -> 19:30 UTC
exports.generateEvening = onSchedule("30 19 * * *", async () => {
  await creaMessaggio("evening", "Sera", 8, 21, 30);
});



