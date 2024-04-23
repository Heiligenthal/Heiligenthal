import { endstateFiller, fillTableWithArray, getEndStates, getTable } from "./TableUtils";

const TRANSITION_COUNT: number = 11; 
const CODE_BASE: number = 94;
const ASCII_ABS: number = 33;

export function generateCode(): String {
    return new tableToTableCode(getTable(), getEndStates()).returnTableCode();
}
export function generateTable(tableCode: String): number[][] {
    let revertedTable = new tableCodeToTable(tableCode);
    let tableStates = revertedTable.returnTableStates();
    fillTableWithArray(tableStates);
    let endStates = revertedTable.returnEndStates();
    endstateFiller(endStates);
    return revertedTable.returnTableStates();
}
function converter(base: number, asciiAbs: number): Function {
    if(base+asciiAbs > 127) console.error("zu viele Zeichen, kein converter möglich");
    let r = (charNumber: number) => {
        if(charNumber>base) console.error("die angegebene Zahl ist zu groß, keine Repräsentation als String möglich");
        return String.fromCharCode(charNumber+asciiAbs);
    }
    return r;
}
function reverter(base: number, asciiAbs: number): Function {
    if(base+asciiAbs > 127) console.error("zu viele Zeichen, kein reverter möglich");
    let r = (charString: String) => {
        return charString.charCodeAt(0)-asciiAbs;
    }
    return r;
}
class tableToTableCode {
    numberRepresentationEndStates: baseXNumber;
    numberRepresentationTableStates: baseXNumber;
    constructor(tableStates: number[][], endStates: number[]){
        this.numberRepresentationEndStates = this.endStatesToNumberRepresentation(endStates);
        this.numberRepresentationTableStates = this.tableStatesToNumberRepresentation(tableStates);
    }
    private endStatesToNumberRepresentation(endStates: number[]): baseXNumber{
        let inputNumbers: number[] = Array(10).fill(0);
        endStates.forEach((state: number)=>
            inputNumbers[state] = 1
        );
        return new baseXNumber(2, inputNumbers);
    }
    private tableStatesToNumberRepresentation(tableStates: number[][]): baseXNumber{
        let inputNumbers: number[] = [];
        tableStates.forEach((state: number[]) => {
            inputNumbers.push(state[0]+1, state[1]+1);
        })
        return new baseXNumber(TRANSITION_COUNT, inputNumbers);
    }
    returnTableCode(): String{
        return this.numberRepresentationTableStates
                    .appendBaseYNumber(this.numberRepresentationEndStates)
                    .toBase(CODE_BASE)
                    .convert(converter(CODE_BASE, ASCII_ABS));
    }
}
class tableCodeToTable {
    numberRepresentationEndStates: baseXNumber;
    numberRepresentationTableStates: baseXNumber;
    constructor(tableCode: String){
        let tableAndEndStates = this.tableCodeToNumberRepresentation(tableCode, reverter(CODE_BASE, ASCII_ABS))
                                        .toBase(2)
                                        .split(10);
        this.numberRepresentationTableStates = this.ensureEvenLength(tableAndEndStates[0].toBase(TRANSITION_COUNT));
        this.numberRepresentationEndStates = tableAndEndStates[1];
       
    }
    private ensureEvenLength(numberRepresentationTableStates: baseXNumber): baseXNumber {
        if (numberRepresentationTableStates.baseNumber.length % 2 !== 0) {
            numberRepresentationTableStates.baseNumber = [0, ...numberRepresentationTableStates.baseNumber];
        } 
        return numberRepresentationTableStates;
    }
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
    private numberRepresentationToEndStates(): number[]{
        return this.numberRepresentationEndStates
                    .baseNumber
                    .map((numberValue: number, numberIndex: number) => numberValue>0?numberIndex:-1)
                    .filter((numberValue: number) => numberValue>-1);
    }
    private tableCodeToNumberRepresentation(tableCode: String, reverter: Function): baseXNumber{
        let numberRepresentation: number[] = [];
        tableCode.split('').forEach((codePart: String) => {
            numberRepresentation.push(reverter(codePart));
        });
        return new baseXNumber(CODE_BASE , numberRepresentation);

    }
    returnTableStates(): number[][]{
        return this.numberRepresentationToTableStates();
    }
    returnEndStates(): number[]{
        return this.numberRepresentationToEndStates();
    }
}
class baseXNumber {
    base: number;
    baseNumber: number[];
    constructor(base:number, baseNumber: number[]){
        this.base = base;
        this.baseNumber = baseNumber;
    }
    toBase = (base:number): baseXNumber => {
        if(this.base == base) return this;
        this.baseNumber = baseXNumber.fromBaseXToBaseY(this.baseNumber, this.base, base);
        this.base = base;
        return this;
    }
    appendBaseYNumber = (baseYNumber: baseXNumber): baseXNumber => {
        let originBase: number = this.base;
        this.baseNumber = this.toBase(2).baseNumber.concat(baseYNumber.toBase(2).baseNumber);
        this.base = 2;
        this.toBase(originBase);
        return this;
    }
    convert = (converter: Function): String => {
        let ret: String = "";
        this.baseNumber.forEach((number: number) => {
        ret += converter(number);
        });
        return ret;
    }
    private static toBase10 = (baseXNumber: number[], base: number): bigint => {
        let base10Number: bigint = 0n;
        let len = baseXNumber.length-1;
        baseXNumber.forEach((v:number, i:number) => {
            base10Number = base10Number + BigInt(v)*BigInt(base)**BigInt((len-i));
        });
        return base10Number;
    }
    private static base10ToBase = (base10Number: bigint, base: number): number[] => {

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
    private static fromBaseXToBaseY = (baseXNumber: number[], baseX: number, baseY:number):number[] => {
        return this.base10ToBase(this.toBase10(baseXNumber, baseX), baseY);
    }
    split = (lastElementLeft: number): [baseXNumber, baseXNumber] => {
        return [new baseXNumber(2, this.baseNumber.slice(0, -lastElementLeft)), new baseXNumber(2, this.baseNumber.slice(-lastElementLeft, this.baseNumber.length))]
    }

}

