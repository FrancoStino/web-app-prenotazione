/* Gestione selezione da prenotare */

const Booking = {}


Booking.numeroPersoneW = document.getElementById('numero-persone-w')

Booking.numeroPersone = document.getElementById('numero-persone')

Booking.tavoliW = document.getElementById('tavoli-w')



Booking.tavoloSelezionato = document.getElementById('tavolo-selezionato')

Booking.messageStatus = document.getElementById('message-status')


async function costruisciSala() {
  Booking.sala = await fetch('sala.json');
  Booking.sala = await Booking.sala.json();

  Booking.tavoli = Booking.sala.tavoli;
  disponiTavoli(Booking.tavoli);
}

costruisciSala()


function disponiTavoli(tavoli) {
  tavoli.forEach((tavolo, i) => {
    let classiTavolo = 'tavolo',
      tavoloDOM = document.createElement('div');
    tavoloDOM.appendChild(document.createTextNode(i + 1));
    classiTavolo += tavolo.occupato ? ' occupato' : ' libero';
    classiTavolo += tavolo.posti == 6 ? ' x6' : ' x4';
    tavoloDOM.setAttribute('class', classiTavolo);
    Booking.tavoliW.appendChild(tavoloDOM);
  })
}

Booking.numeroPersoneW.addEventListener('click', function (e) {
  e.preventDefault()
  let numeroPersone = parseInt(Booking.numeroPersone.textContent);
  console.log(numeroPersone)
  if (e.target.id == 'add') {
    numeroPersone++;
  } else if ((e.target.id == 'sub' && numeroPersone > 1)) {
    numeroPersone--;
  }
  Booking.numeroPersone.textContent = numeroPersone;
});

Booking.tavoliW.addEventListener('click', function (e) {
  e.preventDefault()
  let selezionato = parseInt(e.target.textContent);
  console.log(selezionato)
  if (Booking.tavoli[selezionato - 1].occupato) {
    Booking.messageStatus.textContent = 'Il tavolo è già prenotato';
  } else {
    Booking.tavoloSelezionato.textContent = selezionato;
  }
});


/* Submit prenotazione */
