Projekt neve

messmass

Cél

Olyan helyi alkalmazás létrehozása, amely képes:
	•	Lokális AI-modelleket futtatni (például Ollama segítségével)
	•	Szoftverfejlesztés támogatása (kódgenerálás, hibaelhárítás)
	•	Egyszerű, ChatGPT-szerű felület biztosítása

Technikai stack
	•	Electron (Cross-platform natív app)
	•	Ollama (Lokális AI modellek futtatásához)
	•	HTML/CSS/JavaScript (Frontendhez)
	•	Node.js (Backend logikához)

Alapvető funkciók
	1.	AI-modell futtatása lokálisan
	2.	Chat-alapú kommunikáció az AI-val
	3.	Téma váltás (világos/sötét mód)
	4.	Több AI-modell támogatása (például deepseek-coder, codellama, mistral)
	5.	Modellválasztó menü a felhasználói felületen
	6.	AI routing (több modell használata párhuzamosan vagy egymás után)

Fejlesztési folyamat
	1.	Alap setup
	•	Projekt struktúra létrehozása
	•	Electron környezet konfigurálása
	2.	UI fejlesztése
	•	Chat felület kialakítása
	•	Alap UI elemek (input mező, válaszüzenetek)
	3.	Backend logika
	•	Lokális AI indítása és leállítása automatikusan
	•	Kommunikáció az Ollama-val HTTP API-n keresztül
	4.	Modellválasztó implementálása
	•	UI dropdown létrehozása modellválasztáshoz
	•	Backend logika a modellek dinamikus kezelésére
	5.	Routing logika
	•	Modell routing és fallback implementációja