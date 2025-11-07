# Branching Story Editor

Questa App è uno strumento web-based per la scrittura di storie interattive.

## Caratteristiche Principali

* Editor a grafi per aiutare nello sviluppo di storie non lineari;
* Interazione configurabile con Intelligenza Artificiale Generativa per arricchire i testi delle scene con dettagli puntuali;
* Interazione con database di personaggi, reperti e luoghi annotati. Permette l'integrazione con motori di gioco (ad es. Unreal Engine, Unity) per allestire scene interattive.

Manuale utente e analisi del codice sono disponibili rispettivamente in [/docs/Manuale Utente.pdf](/docs/Manuale%20Utente.pdf) e [/docs/Analisi Codice.pdf](/docs/Analisi%20Codice.pdf).

## ⬇️ Installazione

* Andare sulla [pagina Github del progetto](https://github.com/CGVGroup/branching-story-editor) e scaricare lo zip su `Code > Download zip`  
* Estrarne i contenuti in una cartella di cui tenere nota

### Backend

#### Installando Miniconda

* Scaricare l’installer dal [sito](https://www.anaconda.com/download/success) ed eseguirlo  
* Una volta installato, aprire `Anaconda Prompt`  
* Spostarsi in `cartella del progetto > api > install`  
* Creare un nuovo environment con `conda env create --name Nome --file environment.yaml` (sostituire “Nome” con un nome identificativo per l’environment)  
* Spostarsi in `api`  
* Eseguire `python app.py`

#### Alternativamente, installando manualmente Python

* Scaricare l’installer dal [sito](https://www.python.org/downloads/) ed eseguirlo, oppure installarlo dal Microsoft Store  
* Una volta installato, aprire il `Prompt dei comandi`  
* Spostarsi in `cartella del progetto > api > install`  
* Installare le dipendenze con `pip install -r requirements.txt`  
* Spostarsi in `api`  
* Eseguire `python app.py`

### Frontend

#### Installare Node.js

* Scaricare l’installer (.msi) dal [sito](https://nodejs.org/en) ed eseguirlo  
* Una volta installato, aprire il `Prompt dei comandi`  
* Spostarsi in `cartella del progetto`  
* Installare le dipendenze eseguendo `npm install`  
* Una volta terminato, eseguire `npm start`

**A questo punto, l’applicazione è raggiungibile dal browser all’indirizzo localhost:3000**

## ▶️ Esecuzioni successive

* Aprire `Anaconda Prompt`  
* Spostarsi nella cartella `api`  
* Eseguire `conda activate Nome` (dove “Nome” è il nome precedentemente dato all’environment)  
* Eseguire `python app.py`  
* Aprire il `Prompt dei comandi`  
* Spostarsi in `cartella del progetto`  
* Eseguire `npm start`

## 🔧 Configurazione

I file modificabili del progetto si suddividono in tre categorie:

* File di dati  
* File di configurazione  
  * dell’App  
  * degli LLM

### Dati

Questi file vengono letti e ne viene presentato il contenuto all’interno dell’applicazione.

#### DB

Il database contiene i dettagli di ogni elemento menzionabile nella storia.  

Posizione: `api/db.json`

Struttura: come [DB di esempio](https://drive.google.com/file/d/101fgoX-AP4To0_sF5hyt7RjxzTL6KRYp/view?usp=drive_link)

**Campi comuni** a tutti gli elementi:

* `name`  
* `catalogueNumber`  
* `type`  
* `dating []`  
* `description`  
* `cover`  
* `models []`

Struttura del file:

* `characters`  
  * `ID`  
    * **Campi comuni**  
* `objects`  
  * `ID`  
    * **Campi comuni**  
    * `materials []`  
    * `origin`  
* `locations`  
  * `ID`  
    * **Campi comuni**
    * `origin`

### Configurazione App

Questi file definiscono delle funzionalità minori dell’applicazione, e possono essere utilizzati per personalizzarne alcuni dettagli senza modificare il codice.

#### Enumerazioni

Determina i possibili valori per i dettagli delle scene (ora del giorno, tempo meteorologico, ecc.).

Posizione: `api/enums.yaml`

Struttura:

* `time[]:` ora del giorno  
* `weather[]:` tempo meteorologico  
* `tone[]:` tono della narrazione  
* `value[]:` valore narrativo della scena

#### Tassonomie

Determinano i possibili valori per i filtri di ricerca del DB e per i campi assegnabili agli elementi definiti dall’utente. Perciò è fondamentale che corrispondano ai campi effettivamente presenti all’interno del DB.

Posizione: `api/taxonomies.json`

Struttura:

* `characters[]:` mestieri dei personaggi  
* `objects[]:` tipologie di oggetti  
* `locations[]:` tipologie di luoghi  
* `materials[]:` materiali  
* `areas[]:` aree geografiche  
* `periods[]:` periodi storici

Ogni elemento di ciascuna lista deve essere del tipo:

* `name:` testo da visualizzare  
* `children[]:` eventuali sotto-elementi, anch’essi con lo stesso formato

È **FONDAMENTALE** che non ci siano più elementi con lo stesso esatto nome nella stessa lista.

### Configurazione LLM

Questi file determinano i dettagli delle singole chiamate agli LLM.  
A differenza dei precedenti, ogni file rappresenta una singola configurazione, quindi è previsto che ne vengano creati diversi.

#### Modelli

Ogni file determina un modello di LLM e i suoi parametri.  
All’avvio dell’App, vengono letti tutti i file in `/api/configs`, e vengono usati per popolare il dropdown “Model”.

Posizione: `/api/configs/{nome}.yaml`

Struttura: per ulteriori info su possibili valori e parametri, vedi [`init_chat_model()`](https://python.langchain.com/api_reference/langchain/chat_models/langchain.chat_models.base.init_chat_model.html)

* `provider:` identificativo dell’azienda che produce il modello  
* `model_name:` identificativo del modello  
* `prompt_file:` nome del file di prompt di default  
* `api_key_file:` file con la api key, se necessaria  
* `model_parameters:` parametri di configurazione specifici per ogni modello, vedi `kwargs` di `init_chat_model()`  
  * temperature  
  * max\_tokens  
  * …

`prompt_file` richiede solo il nome del file, senza estensione. Viene cercato in `./prompt/{nome}.yaml`.  
Inoltre, viene usato solo se si richiede “default”, altrimenti viene sovrascritto dalla scelta dell’utente.

## Prompt

Ogni file determina un prompt con campi variabili, utilizzabile da qualsiasi LLM.  
All’avvio dell’App, vengono letti tutti i file in `/api/prompts`, e vengono usati per popolare il dropdown “Prompt”.

Posizione: `/api/prompts/{nome}.yaml`

Struttura:

* `system:` istruzioni per il modello, avranno sempre priorità più alta di `user`  
* `user:` richieste per il singolo messaggio, avranno sempre priorità più bassa di `system`  
* `there_is_a_previous_scene_prompt:` testo che precede il testo della scena precedente, necessario se si vuole aggiungere la scena precedente al prompt

In qualsiasi parte del file si possono aggiungere dei tag del tipo `{tag}`, che verranno sostituiti dal corrispondente valore testuale ad ogni richiesta all’LLM.

* `{prompt}:` il campo “Prompt” della scena  
* `{main_character}:` il nome del protagonista della storia  
* `{characters}:` la lista dei personaggi dell’intera storia  
* `{objects}:` la lista degli oggetti dell’intera storia  
* `{location}:` il luogo dove si svolge la scena  
* `{time}:` l’ora del giorno in cui si svolge la scena  
* `{weather}:` il tempo atmosferico della scena  
* `{tones}:` i toni da adottare nella narrazione  
* `{previous_scene_prompt}:` viene sostituito da `there_is_a_previous_scene_prompt`, se esiste e c’è una scena precedente  
* `{previous_scene}:` il testo della scena precedente
