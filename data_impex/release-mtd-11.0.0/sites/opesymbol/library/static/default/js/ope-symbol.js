function translateButtonText() { 
	
	let topPage = document.getElementById('top-page');
	let skipToMainContentButton = document.getElementById('skip-to-main-content-button');
	let languageSelectorWidgetPlaceholder = document.getElementById('language-selector-widget-placeholder');
	let backToTopButton = document.getElementById('back-to-top-button');

	// Bosnian (scr)
	if (topPage.classList.contains('scr')) {
		skipToMainContentButton.innerHTML = 'Prijeđite na glavni sadržaj'; // Prije&#273;ite na glavni sadr&#382;aj
		languageSelectorWidgetPlaceholder.text = 'Jezici';
		backToTopButton.value = 'Povratak na vrh';
		backToTopButton.innerHTML = 'Povratak na vrh';
	// Croatian (hr)
	} else if (topPage.classList.contains('hr')) {
		skipToMainContentButton.innerHTML = 'Prijeđite na glavni sadržaj'; // Prije&#273;ite na glavni sadr&#382;aj
		languageSelectorWidgetPlaceholder.text = 'Jezici';
		backToTopButton.value = 'Povratak na vrh';
		backToTopButton.innerHTML = 'Povratak na vrh';
	// Czech (cs)
	} else if (topPage.classList.contains('cs')) {
		skipToMainContentButton.innerHTML = 'Přeskočit na hlavní obsah'; // p&#345;esko&#269;it na hlavn&iacute; obsah
		languageSelectorWidgetPlaceholder.text = 'Jazyky';
		backToTopButton.value = 'Návrat na začátek'; // N&aacute;vrat na za&#269;&aacute;tek
		backToTopButton.innerHTML = 'Návrat na začátek';
	// Danish (da)
	} else if (topPage.classList.contains('da')) {
		skipToMainContentButton.innerHTML = 'Gå til hovedindhold'; // G&amp;aring; til hovedindhold
		languageSelectorWidgetPlaceholder.text = 'Sprog';
		backToTopButton.value = 'Tilbage til toppen';
		backToTopButton.innerHTML = 'Tilbage til toppen';
	// Dutch (nl)
	} else if (topPage.classList.contains('nl')) {
		skipToMainContentButton.innerHTML = 'Ga naar de hoofdinhoud';
		languageSelectorWidgetPlaceholder.text = 'Talen';
		backToTopButton.value = 'Terug naar boven';
		backToTopButton.innerHTML = 'Terug naar boven';
	// Estonian (et)
	} else if (topPage.classList.contains('et')) {
		skipToMainContentButton.innerHTML = 'Minge põhisisu juurde'; // Minge p&otilde;hisisu juurde
		languageSelectorWidgetPlaceholder.text = 'Keeled';
		backToTopButton.value = 'Tagasi üles'; // Tagasi &uuml;les
		backToTopButton.innerHTML = 'Tagasi üles';
	// Finnish (fi)
	} else if (topPage.classList.contains('fi')) {
		skipToMainContentButton.innerHTML = 'Hyppää pääsisältöön'; // Hypp&auml;&auml; p&auml;&auml;sis&auml;lt&ouml;&ouml;n
		languageSelectorWidgetPlaceholder.text = 'Kielet';
		backToTopButton.value = 'Takaisin alkuun';
		backToTopButton.innerHTML = 'Takaisin alkuun';		
	// German (de)
	} else if (topPage.classList.contains('de')) {
		skipToMainContentButton.innerHTML = 'Zum Hauptinhalt springen';
		languageSelectorWidgetPlaceholder.text = 'Sprachen';
		backToTopButton.value = 'Zurück nach oben'; // Zur&uuml;ck nach oben
		backToTopButton.innerHTML = 'Zurück nach oben';
	// Hungarian (hu)
	} else if (topPage.classList.contains('hu')) {
		skipToMainContentButton.innerHTML = 'Ugrás a tartalomra'; // Ugr&aacute;s a tartalomra
		languageSelectorWidgetPlaceholder.text = 'Nyelvek';
		backToTopButton.value = 'Vissza a tetejére'; // Vissza a tetej&eacute;re
		backToTopButton.innerHTML = 'Vissza a tetejére';
	// Italian (it)
	} else if (topPage.classList.contains('it')) {
		skipToMainContentButton.innerHTML = 'Salta al contenuto';
		languageSelectorWidgetPlaceholder.text = 'Le lingue';
		backToTopButton.value = 'Torna in cima';
		backToTopButton.innerHTML = 'Torna in cima';
	// Latvian (lv)
	} else if (topPage.classList.contains('lv')) {
		skipToMainContentButton.innerHTML = 'Doties uz galveno saturu';
		languageSelectorWidgetPlaceholder.text = 'Valodas';
		backToTopButton.value = 'Atpakaļ uz augšu'; // Atpaka&#316; uz aug&#353;u
		backToTopButton.innerHTML = 'Atpakaļ uz augšu';
	// Lithuanian (lt)
	} else if (topPage.classList.contains('lt')) {
		skipToMainContentButton.innerHTML = 'Eiti į pagrindinį turinį'; // Eiti &#303; pagrindin&#303; turin&#303;
		languageSelectorWidgetPlaceholder.text = 'Kalbos';
		backToTopButton.value = 'Atgal į viršų'; // Atgal &#303; vir&#353;&#371;
		backToTopButton.innerHTML = 'Atgal į viršų';
	// Norwegian (no)
	} else if (topPage.classList.contains('no')) {
		skipToMainContentButton.innerHTML = 'Gå til hovedinnhold'; // G&aring; til hovedinnhold
		languageSelectorWidgetPlaceholder.text = 'Språk'; // Spr&aring;k
		backToTopButton.value = 'Tilbake til toppen';
		backToTopButton.innerHTML = 'Tilbake til toppen';
	// Polish (pl)
	} else if (topPage.classList.contains('pl')) {
		skipToMainContentButton.innerHTML = 'Przejdź do głównej zawartości'; // Przejd&#378; do g&#322;&oacute;wnej zawarto&#347;ci
		languageSelectorWidgetPlaceholder.text = 'Języki'; // J&#281;zyki
		backToTopButton.value = 'Powrót do góry'; // Powr&oacute;t do g&oacute;ry
		backToTopButton.innerHTML = 'Powrót do góry';
	// Russian (ru)
	} else if (topPage.classList.contains('ru')) {
		skipToMainContentButton.innerHTML = 'перейти к основному содержанию'; // &#1087;&#1077;&#1088;&#1077;&#1081;&#1090;&#1080; &#1082; &#1086;&#1089;&#1085;&#1086;&#1074;&#1085;&#1086;&#1084;&#1091; &#1089;&#1086;&#1076;&#1077;&#1088;&#1078;&#1072;&#1085;&#1080;&#1102;
		languageSelectorWidgetPlaceholder.text = 'Языки'; // &#1071;&#1079;&#1099;&#1082;&#1080;
		backToTopButton.value = 'Вернуться наверх'; // &#1042;&#1077;&#1088;&#1085;&#1091;&#1090;&#1100;&#1089;&#1103; &#1085;&#1072;&#1074;&#1077;&#1088;&#1093;
		backToTopButton.innerHTML = 'Вернуться наверх';
	// Slovak (sk)
	} else if (topPage.classList.contains('sk')) {
		skipToMainContentButton.innerHTML = 'Prejdite na hlavný obsah'; // Prejdite na hlavn&yacute; obsah
		languageSelectorWidgetPlaceholder.text = 'Jazyky';
		backToTopButton.value = 'Späť na začiatok'; // Sp&auml;&#357; na za&#269;iatok
		backToTopButton.innerHTML = 'Späť na začiatok';
	// Slovenian (sl)
	} else if (topPage.classList.contains('sl')) {
		skipToMainContentButton.innerHTML = 'Pojdi na glavno vsebino';
		languageSelectorWidgetPlaceholder.text = 'Jeziki';
		backToTopButton.value = 'Nazaj na vrh';
		backToTopButton.innerHTML = 'Nazaj na vrh';
	// Ukrainian (uk)
	} else if (topPage.classList.contains('uk')) {
		skipToMainContentButton.innerHTML = 'Перейти до основного вмісту'; // &#1055;&#1077;&#1088;&#1077;&#1081;&#1090;&#1080; &#1076;&#1086; &#1086;&#1089;&#1085;&#1086;&#1074;&#1085;&#1086;&#1075;&#1086; &#1074;&#1084;&#1110;&#1089;&#1090;&#1091;
		languageSelectorWidgetPlaceholder.text = 'Мови'; // &#1052;&#1086;&#1074;&#1080;
		backToTopButton.value = 'Наверх до вершини'; // &#1053;&#1072;&#1074;&#1077;&#1088;&#1093; &#1076;&#1086; &#1074;&#1077;&#1088;&#1096;&#1080;&#1085;&#1080;
		backToTopButton.innerHTML = 'Наверх до вершини';
		
	/* * * The 3 original site languages with full content - English (es), Spanish (es), French (fr) * * */
	
	// Spanish (es)
	} else if (topPage.classList.contains('es')) {
		skipToMainContentButton.innerHTML = 'Saltar al contenido principal';
		languageSelectorWidgetPlaceholder.text = 'Idiomas';
		backToTopButton.value = 'volver arriba';
		backToTopButton.innerHTML = 'volver arriba';
	// French (fr)
	} else if (topPage.classList.contains('fr')) {
		skipToMainContentButton.innerHTML = 'Aller au contenu principal';
		languageSelectorWidgetPlaceholder.text = 'Langues';
		backToTopButton.value ='haut de page';
		backToTopButton.innerHTML = 'Haut de la page';
	// Default - English (en)
	} else {
		skipToMainContentButton.innerHTML = 'Skip to main content';
		languageSelectorWidgetPlaceholder.text = 'Languages';
		backToTopButton.value = 'Back to top';
		backToTopButton.innerHTML = 'Back to top';
	}
	
};

translateButtonText();