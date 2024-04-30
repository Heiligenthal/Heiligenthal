import { endstateFiller, fillTableWithArray, getEndStates, getTable } from "./TableUtils";

const TRANSITION_COUNT: number = 11; 
const BASE64_ALPHABET: String[] =
'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
const BASE58_ALPHABET: String[] = 
'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('');
const ENCODING_ALPHABET: String[] = BASE58_ALPHABET;

type Alphabet = String[];
type IncrementFlag = baseXNumber;
// type EndStates = [0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1];
// type State = [0|1|2|3|4|5|6|7|8|9, 0|1|2|3|4|5|6|7|8|9];
// type TableStates = number[][];

function isAlphabet(alphabet: String[]): alphabet is Alphabet {
    if(alphabet.length == 0) return false;
    const seen: Set<String> = new Set();
    for(const digit of alphabet){
        if(digit.length != 1) return false;
        if(seen.has(digit)) return false;
        seen.add(digit);
    }
    return true;
}
/**
 * Typeguard: Bestimme, ob eine baseXNumber vom Typ IcrementFlag ist
 * @param {baseXNumber} incrementFlag - Die baseXNumber, die darauf überprüft werden soll, ob sie ein IncrementFlag ist
 * @returns {boolean} ob incrementFlag vom Typ IncrementFlag ist
 */
function isIncrementFlag(incrementFlag: baseXNumber): incrementFlag is IncrementFlag {
    if(incrementFlag.base != 2) return false;
    if(incrementFlag.baseNumber.length != 1) return false;
    if(incrementFlag.baseNumber[0] == 1) return true;
    if(incrementFlag.baseNumber[0] == 0) return true;
    return false;
}
/**
 * Generiert eine Zeichenkette, die für den Export der Deltatabelle verwendet wird
 * 
 * Sie [die Zeichenkette] besteht aus drei Teilen: 
 * - Tabelle                (tableStates)
 * - Endzustände            (enStates)
 * - Inkrementierungsflag   (incrementFlag)
 * 
 * Sie werden in dieser Reihenfolge aneinandergehängt.
 * Um Zustände - und somit Zeichen - zu reduzieren, werden die jeweiligen Teile zunächst
 * in ein Basis - 2 System umgewandelt, um anschließend mit einer Basis - 54 ausgegeben zu
 * werden
 * 
 * Funktion verwendet die aus "./TableUtils" importierten Funktionen 
 * @function getTable()
 * @function getEndstates()
 * 
 * 
 * 
 * um die Zeichenkette wieder in die Deltatabelle zu transformieren, ist {@link generateTable()} zu verwenden
 * 
 * @returns {String} die Zeichenkette
 */
export function generateCode(): String {
    let tableStates: number[][] = getTable();
    let endStates: number[] = getEndStates();
    return new tableToTableCode(tableStates, endStates).returnTableCode();
}
/**
 * Setzt die Deltatabelle
 * @param {String} tableCode - Zeichenkette, die Importiert wurde.
 * Für Informationen über die Zeichenkette und wie man sie erhält sehen Sie {@link generateCode()}
 * @returns die Tabelle (tableCode)
 */
export function generateTable(tableCode: String): number[][] {
    let revertedTable = new tableCodeToTable(tableCode);
    let tableStates = revertedTable.returnTableStates();
    fillTableWithArray(tableStates);
    let endStates = revertedTable.returnEndStates();
    endstateFiller(endStates);
    return revertedTable.returnTableStates();
}
/**
 * Gibt an, wie eine Ziffer einer Zahl der Basis X interpretiert wird ({@link baseXNumber})
 * @param {String[]} alphabet das Encodierungsalphabet, das verwendet wird.
 * Es wird zur Zeit die Encodierung Basis58 verwendet: {@link BASE58_ALPHABET}
 * @returns {Function} eine Funktion, die eine Zahl 
 */
function converter(alphabet: String[]): (digit: number) => String {
    if(!isAlphabet(alphabet)) console.error("das verwendete Encodierungsalphabet ist fehlerhaft");
    /**
     * 
     * @param digit die Zahl, welche in die Encodierungsalphabet-Schreibweise umgewandelt wird
     * @returns {String} das Entsprechende Symbol des Encoding-Alphabets
     */
    let r = (digit: number): String => {
        if(digit>alphabet.length) {
            console.error(`die angegebene Zahl ${digit} ist größer als die codierung erlaubt`);
            return alphabet[0];
        }
        return alphabet[digit];
    }
    return r;
}
function reverter(alphabet: String[]): (digit: String) => number {
    if(!isAlphabet(alphabet)) console.error("das verwendete Encodierungsalphabet ist fehlerhaft");
    let r = (digit: String) => {
        if(!alphabet.includes(digit)) {
            console.error(`das gelesene Zeichen ${digit} ist nicht in der verwendeten codierung erlaubt`);
            return 0;
        }
        return alphabet.indexOf(digit);
    }
    return r;
}
abstract class tableConverter {
    numberRepresentationEndStates: baseXNumber;
    numberRepresentationTableStates: baseXNumber;
    incrementFlag: IncrementFlag;
    constructor(numberRepresentationEndStates: baseXNumber, numberRepresentationTableStates: baseXNumber, incrementFlag: IncrementFlag){
        this.numberRepresentationEndStates = numberRepresentationEndStates;
        this.numberRepresentationTableStates = numberRepresentationTableStates;
        this.incrementFlag = incrementFlag;
    }

}
/**
 * Verantwortlich für das Umwandeln der Deltatabelle (tableStates) und der Endzustände (endStates) in eine Zeichenkette (tableCode)
 * @extends tableConverter 
 */
class tableToTableCode extends tableConverter{
    constructor(tableStates: number[][], endStates: number[]){
        let numberRepresentationEndStates = tableToTableCode.endStatesToNumberRepresentation(endStates);
        let numberRepresentationTableStates = tableToTableCode.tableStatesToNumberRepresentation(tableStates);
        let incrementFlag = tableToTableCode.tableStatesToIncrementFlag(tableStates);
        super(numberRepresentationEndStates, numberRepresentationTableStates, incrementFlag);
    }
    /**
     * Nimmt die Endzustände und repräsentiert sie als eine Basis 2 Nummer (baseXNumber)
     * @param endStates die Endzustände
     * @returns die Nummer zur Basis 2
     */
    private static endStatesToNumberRepresentation(endStates: number[]): baseXNumber{
        let inputNumbers: number[] = Array(10).fill(0);
        endStates.forEach((state: number)=>
            inputNumbers[state] = 1
        );
        return new baseXNumber(2, inputNumbers);
    }
    /**
     * Nimmt die Deltatabelle und repräsentiert sie als eine Basis 11 Nummer (baseXNumber)
     * @param tableStates die Deltatabelle
     * @returns die Nummer zur Basis 11
     */
    private static tableStatesToNumberRepresentation(tableStates: number[][]): baseXNumber{
        let inputNumbers: number[] = [];
        tableStates.forEach((state: number[]) => {
            inputNumbers.push(state[0]+1, state[1]+1);
        })
        return new baseXNumber(TRANSITION_COUNT, inputNumbers);
    }
    /**
     * Bestimmt, ob Inkrementierung der Deltatabelle (tableCode) notwendig ist und ein Inkrementierungsflag gesetzt wird
     * @param tableStates die Deltatabelle
     * @returns das Inkrementierungsflag als Basis 2 Nummer
     */
    private static tableStatesToIncrementFlag(tableStates: number[][]): IncrementFlag{
        let flag = 0;
        if(tableStates[0][0] == -1) flag = 1;
        return new baseXNumber(2,[flag]);
    }
    /**
     * Nimmt die internen Nummern zur Basis x (baseXNumber) und hängt sie aneinander in der Reihenfolge
     * @var this.numberRepresentationTableStates @var this.numberRepresentationEndStates @var this.incrementFlag
     * um die Zeichenkette (tableCode) zur Verfügung zu stellen. Der Nutzen dieser ist in {@link generateCode()} beschrieben
     * @returns die Zeichenkette
     */
    returnTableCode(): String{
        this.increment();
        return this.numberRepresentationTableStates
                    .appendBaseYNumber(this.numberRepresentationEndStates)
                    .appendBaseYNumber(this.incrementFlag)
                    .toBase(ENCODING_ALPHABET.length)
                    .convert(converter(ENCODING_ALPHABET));
    }
    /**
     * Ist das Inkrementierungsflag gesetzt, inkrementiert diese Funktion die Deltatabelle (tableCode).
     * Dies geschieht, um zu verhindern, dass bei der Basistransformation führende Nullen verloren werden. 
     * Um zu entscheiden, ob diese Aktion notwendig ist, wird in {@link tableStatesToIncrementFlag()} bestimmt.
     */
    private increment(){  
        if(!isIncrementFlag(this.incrementFlag)) {
            console.error("Der zur Inkrementierung angegebene Flag ist ungültig");
            return;
        }
        if(this.incrementFlag.baseNumber[0] != 1) return;
        this.numberRepresentationTableStates.baseNumber = 
        this.numberRepresentationTableStates.baseNumber.map((state: number) => (state+TRANSITION_COUNT+1)%TRANSITION_COUNT); 
    }
}
/**
 * Verantwortlich für das Transformieren der Zeichenkette (tableCode) in die Deltatabelle (tableStates) und ihre Endzustände (endStates)
 * @extends tableConverter
 */
class tableCodeToTable extends tableConverter{
    constructor(tableCode: String){
        let tableEndStatesAndChangeFlag: [baseXNumber, baseXNumber, baseXNumber] = tableCodeToTable.tableCodeToNumberRepresentation(tableCode, reverter(ENCODING_ALPHABET))
                                        .toBase(2)
                                        .split();
        let numberRepresentationTableStates = tableEndStatesAndChangeFlag[0].toBase(TRANSITION_COUNT);
        let numberRepresentationEndStates = tableEndStatesAndChangeFlag[1];
        let changeFlag = tableEndStatesAndChangeFlag[2];
        super(numberRepresentationEndStates, numberRepresentationTableStates, changeFlag);
       
    }
    /**
     * Nimmt die entsprechende Basis 11 Nummer und repräsentiert sie als Deltatabelle (tableStates)
     * @returns die Deltatabelle (tableStates)
     */
    private numberRepresentationToTableStates(): number[][]{
        let internalNumber: number[] = this.numberRepresentationTableStates.baseNumber;
        let tableStates: number[][] = [];
        let notEndOfList: boolean = true;
        let stateNumber: number = 0;
        while(notEndOfList){
            let state: number[] = [];
            if((internalNumber.length - stateNumber*2) < 2){
                notEndOfList = false;
            }
            else{
                state[0] = internalNumber[stateNumber*2]-1;
                state[1] = internalNumber[stateNumber*2+1]-1;
                tableStates[stateNumber] = [state[0], state[1]];
            }
            stateNumber++;
        }
        return tableStates;
    }
    /**
     * Nimmt die entsprechende Basis 2 Nummer und repräsentiert sie als Endzustände (endStates)
     * @returns die Endzustände (endStates)
     */
    private numberRepresentationToEndStates(): number[]{
        return this.numberRepresentationEndStates
                    .baseNumber
                    .map((numberValue: number, numberIndex: number) => numberValue>0?numberIndex:-1)
                    .filter((numberValue: number) => numberValue>-1);
    }
    /**
     * Nimmt die Zeichenkette und repräsentiert sie als eine Basis 58 Zahl mit Hilfe eines Reverters
     * @param tableCode die Zeichenkette
     * @param reverter der Reverter
     * @returns die Basis 58 Zahl 
     */
    private static tableCodeToNumberRepresentation(tableCode: String, reverter: Function): baseXNumber{
        let numberRepresentation: number[] = [];
        tableCode.split('').forEach((codePart: String) => {
            numberRepresentation.push(reverter(codePart));
        });
        return new baseXNumber(ENCODING_ALPHABET.length , numberRepresentation);

    }
    /**
     * Gibt die Deltatabelle (tableStates) aus
     * @returns die Deltatabelle
     */
    returnTableStates(): number[][]{
        this.decrement();
        return this.numberRepresentationToTableStates();
    }
    /**
     * Gibt die Endzustände (endStates) aus
     * @returns die Endzustände
     */
    returnEndStates(): number[]{
        return this.numberRepresentationToEndStates();
    }
    /**
     * Ist das Inkrementierungsflag gesetzt, dekrementiert diese Funktion die Deltatabelle (tableCode).
     * Dies geschieht, um zu verhindern, dass bei der Basistransformation führende Nullen verloren werden. 
     */
    private decrement(){
        if(!isIncrementFlag(this.incrementFlag)) {
            console.error("Der zur Inkrementierung angegebene Flag ist ungültig");
            return;
        }
        if(this.incrementFlag.baseNumber[0] != 1) return;
        this.numberRepresentationTableStates.baseNumber =
        this.numberRepresentationTableStates.baseNumber.map((state: number) => (state+TRANSITION_COUNT-1)%TRANSITION_COUNT);
    }
}
/**
 * kann eine Zahl zu jeder Ganzzahliger Basis repräsentieren
 * @var base - die Basis der Zahl
 * @var baseNumber - die Repräsentation der Zahl zur 
 */
class baseXNumber {
    base: number;
    baseNumber: number[];
    constructor(base:number, baseNumber: number[]){
        this.base = base;
        this.baseNumber = baseNumber;
    }
    /**
     * Transformiert die Nummer in eine andere Basis
     * @param base die Basis, in die transformiert werden soll
     * @returns die Nummer mit der neuen Basis (sich selbst)
     */
    toBase(base:number): baseXNumber {
        if(this.base == base) return this;
        this.baseNumber = baseXNumber.fromBaseXToBaseY(this.baseNumber, this.base, base);
        this.base = base;
        return this;
    }
    /**
     * Konkatiniert eine Nummer einer beliebigen Basis an diese Nummer. Es wird diese Nummer zurückgegeben, die Basis bleibt erhalten
     * @param baseYNumber die anzuhängende Nummer
     * @returns die konkatinierte Nummer (sich selbst)
     */
    appendBaseYNumber(baseYNumber: baseXNumber): baseXNumber {
        let originBase: number = this.base;
        this.baseNumber = this.toBase(2).baseNumber.concat(baseYNumber.toBase(2).baseNumber);
        this.base = 2;
        this.toBase(originBase);
        return this;
    }
    /**
     * Nutzt einen {@link converter()}, um die Zahl als Zeichenkette darzustellen
     * @param converter der Converter
     * @returns die Zeichenkette
     */
    convert(converter: Function): String {
        let ret: String = "";
        this.baseNumber.forEach((number: number) => {
        ret += converter(number);
        });
        return ret;
    }
    /**
     * Stellt eine Nummer zur beliebigen Basis als Basis 10 Nummer da.
     * Wird von {@link fromBaseXToBaseY()} verwendet, um zwischen Basen zu wechseln
     * @param baseXNumber die Nummer zur beliebigen Basis
     * @param base die gewünschte Basis
     * @returns {bigint} die Zahl zur Basis 10 
     */
    private static toBase10(baseXNumber: number[], base: number): bigint {
        let base10Number: bigint = 0n;
        let len = baseXNumber.length-1;
        baseXNumber.forEach((v:number, i:number) => {
            base10Number = base10Number + BigInt(v)*BigInt(base)**BigInt((len-i));
        });
        return base10Number;
    }
    /**
     * Stellt eine Nummer zur Basis 10 als Nummer zur beliebigen ganzzahligen Nummer da.
     * Wird von {@link fromBaseXToBaseY()} verwendet, um zwischen Basen zu wechseln
     * @param {bigint} base10Number die Nummer zur basis 10
     * @param {number} base die gewünschte Basis
     * @returns {number[]} die Nummer zur gewünschten ganzzahligen Basis
     */
    private static base10ToBase(base10Number: bigint, base: number): number[] {

        let bigIntBase = BigInt(base);
        if(base10Number <= 0) return [0];
        let r: bigint[] = [];
        let going: boolean = true;
        let i: number = 0;
        while(going){
            r[i] = base10Number%bigIntBase;
            base10Number = base10Number/bigIntBase;
            if(base10Number == 0n) going = false;
            i++;
        }
        r.reverse();
        return r.map((v: bigint) => Number(v));
    }
    /**
     * Stellt eine Nummer beliebiger Basis als Nummer beliebiger Basis dar
     * @param {number[]} baseXNumber die Nummer beliebiger Basis
     * @param baseX die dazugehörige Basis
     * @param baseY die gewünschte Basis
     * @returns {number[]} die Nummer gewünschter Basis
     */
    private static fromBaseXToBaseY(baseXNumber: number[], baseX: number, baseY:number):number[] {
        return this.base10ToBase(this.toBase10(baseXNumber, baseX), baseY);
    }
    /**
     * Teilt die Nummer in drei Teile - diese repräsentieren die drei Teile des Tabellencodes: 
     * @var tableStates Deltatabelle
     * @var endStates Endzustände
     * @var incrementFlag Inkrementierungsflag
     * @returns {[baseXNumber, baseXNumber, baseXNumber]} die drei bestandteile des Tablecodes
     */
    split(): [baseXNumber, baseXNumber, baseXNumber] {
        const endStatesBegin = 11;
        return [
            new baseXNumber(2, this.baseNumber.slice(0, -endStatesBegin)), 
            new baseXNumber(2, this.baseNumber.slice(-endStatesBegin, this.baseNumber.length -1)), 
            new baseXNumber(2, this.baseNumber.slice(this.baseNumber.length-1,this.baseNumber.length))
        ];
    }

}
