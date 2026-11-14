class EnneaLoJeyCalculator {
    constructor() {
        this.cyA = [3, 6, 9];
        this.cyB = [4, 1, 7, 5, 8, 2];
    }

    _normalize(node) {
        if (typeof node === 'string' && node.toUpperCase().startsWith('N')) {
            return parseInt(node.slice(1), 10);
        }
        return Number(node);
    }

    _getCycle(nodeNum) {
        if (this.cyA.includes(nodeNum)) {
            return this.cyA;
        } else if (this.cyB.includes(nodeNum)) {
            return this.cyB;
        } else {
            throw new Error(`Node ${nodeNum} tidak valid dalam cyA atau cyB.`);
        }
    }

    calculate(start, opStr) {
        // Regex: Memastikan bagian g/gb TIDAK ADA huruf 'N'
        const match = opStr.match(/^([#b])(N?)(\d+)\s*\(?((?:g|gb)(\d+))\)?$/i) || 
                      opStr.match(/^([#b])(N?)(\d+)/i);
        
        if (!match) {
            throw new Error(`Format operasi tidak valid: ${opStr}`);
        }

        const symbol = match[1];
        const hasOpN = !!match[2];
        const steps = parseInt(match[3], 10);

        const growthPartRaw = match[4] || null;
        let growthType = null;
        let growthSteps = 0;

        if (growthPartRaw) {
            const gMatch = growthPartRaw.match(/^(g|gb)(\d+)$/i);
            if (gMatch) {
                growthType = gMatch[1].toLowerCase();
                growthSteps = parseInt(gMatch[2], 10);
            }
        }

        const formattedOp = growthPartRaw 
            ? `${symbol}${hasOpN ? 'N' : ''}${steps}(${growthType}${growthSteps})`
            : `${symbol}${hasOpN ? 'N' : ''}${steps}`;

        const startNum = this._normalize(start);
        const cycle = this._getCycle(startNum);
        const useN = hasOpN;

        const idx = cycle.indexOf(startNum);
        const rawPath = [startNum];
        const direction = symbol === '#' ? 1 : -1;
        let currentIdx = idx;

        for (let i = 0; i < steps; i++) {
            currentIdx = (currentIdx + direction + cycle.length) % cycle.length;
            rawPath.push(cycle[currentIdx]);
        }

        const path = rawPath.map(val => useN ? `N${val}` : val);
        const resultVal = cycle[currentIdx];
        const result = useN ? `N${resultVal}` : resultVal;

        let growthResultObj = null;

        if (growthPartRaw) {
            const growthCycle = this._getCycle(resultVal);
            const isGrowthCyA = growthCycle === this.cyA;
            
            // Validasi batas maksimal growth steps
            if (isGrowthCyA && growthSteps > 2) {
                throw new Error(`Growth steps untuk cyA maksimal 2 (ditemukan: ${growthSteps})`);
            }
            if (!isGrowthCyA && growthSteps > 5) {
                throw new Error(`Growth steps untuk cyB maksimal 5 (ditemukan: ${growthSteps})`);
            }

            const growthIdx = growthCycle.indexOf(resultVal);
            const growthDir = growthType === 'g' ? 1 : -1;
            const rawGrowthPath = [resultVal];
            let currentGrowthIdx = growthIdx;

            for (let i = 0; i < growthSteps; i++) {
                currentGrowthIdx = (currentGrowthIdx + growthDir + growthCycle.length) % growthCycle.length;
                rawGrowthPath.push(growthCycle[currentGrowthIdx]);
            }

            // Path & Result growth murni angka biasa (tanpa N) sesuai aturan
            const growthPath = rawGrowthPath; 
            const finalGrowthResult = growthPath[growthPath.length - 1];

            growthResultObj = {
                op: `${growthType}${growthSteps}`,
                path: growthPath,
                result: finalGrowthResult
            };
        }

        return {
            start: start,
            operation: formattedOp,
            path: path,
            result: result,
            growth: growthResultObj,
            resultVal: resultVal
        };
    }
}

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const calc = new EnneaLoJeyCalculator();

const baseNodes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const validNodes = [...baseNodes, ...baseNodes.map(n => `N${n}`)];
const symbols = ['#', 'b'];

const results = [];
for (let i = 0; i < 50; i++) {
    const start = randomChoice(validNodes);
    const startNum = calc._normalize(start);
    const cycle = calc._getCycle(startNum);
    const isCyA = cycle === calc.cyA;

    const symbol = randomChoice(symbols);
    const includeNInOp = Math.random() < 0.5 ? 'N' : '';
    
    const maxSteps = isCyA ? 10 : 19;
    const steps = randomInt(1, maxSteps);
    
    let op = `${symbol}${includeNInOp}${steps}`;

    if (Math.random() < 0.5) {
        const gType = randomChoice(['g', 'gb']);
        
        // Batasan acak growth steps: cyA max 2, cyB max 5 (tanpa N)
        const gSteps = isCyA ? randomInt(1, 2) : randomInt(1, 5);
        
        op += `(${gType}${gSteps})`;
    }

    const res = calc.calculate(start, op);
    results.push(res);
}

results.forEach((r, index) => {
    const iStr = String(index + 1).padStart(2, '0');
    let logStr = `Test ${iStr} -> Start: ${r.start}, Op: ${r.operation}, Path: [${r.path.join(', ')}], Result: ${r.result}`;
    
    if (r.growth) {
        logStr += `; ${r.resultVal}${r.growth.op}, Path: [${r.growth.path.join(', ')}], GrowthResult: ${r.growth.result}`;
    }
    
    console.log(logStr);
});
