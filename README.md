Dieses Projekt dient der Bereitstellung eines Codeausschnitts in TypeScripts.
Der Ausschnitt stammt aus einem Projekt, in dem es darum geht, einen deterministischen endlichen Automaten (DEA) in einer PWA zu simulieren.
Der DEA ist auf 10 Zustände und einen Fehlerzustand limitiert und das Eingabealphabet ist auf {0, 1} festgelegt.
Der zur verfügung gestellte Code liest den Automaten in Form einer Deltatabelle ein und gibt eine Zeichenkette aus,
welche von anderen Nutzern der Anwendung verwendet werden kann, um den selben DEA auf ihrem Rechner ansehen zu können.

Die bereitgestellten Schnittstellen für anderen Komponenten umfassen die Funktionen generateCode() und generateTable()
Die verwendeten Schnittstellen umfassen die Funktionen fillTableWithArray(), getEndStates() und getTable() aus dem Komponent TableUtils

generateCode() verwendet die Funktionen getTable() und getEndStates() um die Beschriebene Zeichenkette zu generieren.
Diese wird als String zurückgegeben.

generateTable() akzeptiert einen eben solchen String und erstellt daraufhin mit fillTableWithArray() die Deltatabelle und somit den Automaten

Die Deltatabelle wird als Array aus number Arrays exportiert und importiert. Die Darstellungsweise ist hierbei einheitlich folgendermaßen:
Der Index des number Arrays stellt den Namen des Zustandes dar. 
Index 0 des number Arrays im Array stellt den Zustandsübergang für die Eingabe 0 dar.
Index 1 des number Arrays im Array stellt den Zustandsübergang für die Eingabe 1 dar.
Falls in den Restzustand übergegegangen wird, steht dort -1, ansonsten der Index des Zustandes, in welchen übergangen wird.
Es ist nicht erlaubt, in Zustand 0 beide Zustandsübergänge auf den Restzustand übergehen zu lassen.
Beispiel:
Zustand 0 geht für die Eingabe von 0 in Zustand 1 über.
Zustand 0 geht für die Eingabe von 1 in den Restzustand über.
Zustand 1 geht für beide Eingaben in Zustand 0 über.
es existieren keine weiteren Zustände.
Darstellung: [[0, -1], [0, 0]]

Die Endzustände werden als number Array exportiert und importiert. Die Darstellungsweise ist hierbei einheitlich folgendermaßen:
Die Endzustände werden aufsteigend in den Array geschrieben.
Es muss mindestens einen Endzustand geben.
Beispiel:
Zustand 0 ist kein Endzustand.
Zustand 1 ist Endzustand.
Es existieren keine weiteren Zustände.
Darstellung: [1]


Wenn dieser Code verwendet werden möchte, ist es nötig, die Funktionen der Komponente TableUtils bereitzustellen.
Eine Funktion zur setzung der Endzustände existierte zum Zeitpunkt der Erstellung des Repositoriums noch nicht,
demnach ist auch das Setzen der Endzustände mit der Funktion generateTable() nicht möglich.

Autor dieser Komponente ist Alexander Heiligenthal

