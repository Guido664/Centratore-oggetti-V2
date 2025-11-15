
import React, { useState } from 'react';
import Visualization from './Visualization';
import type { VisualData } from './Visualization';

const App: React.FC = () => {
  const [wallWidth, setWallWidth] = useState<string>('300');
  const [numObjects, setNumObjects] = useState<string>('3');
  const [objectWidth, setObjectWidth] = useState<string>('10.0');
  const [desiredSpacing, setDesiredSpacing] = useState<string>('');
  const [results, setResults] = useState<string | null>(null);
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const formatNumber = (num: number): string => {
    if (num % 1 === 0) {
      return num.toString();
    }
    return num.toFixed(1);
  };

  const calculatePositions = () => {
    setError(null);
    setResults(null);
    setVisualData(null);

    const wallW = parseFloat(wallWidth);
    const numObj = parseInt(numObjects, 10);
    const objW = parseFloat(objectWidth);
    const space = parseFloat(desiredSpacing) || 0;

    if (isNaN(wallW) || isNaN(numObj) || isNaN(objW)) {
      setError('Tutti i campi numerici devono essere validi.');
      return;
    }

    if (wallW <= 0) {
      setError('La larghezza del muro deve essere maggiore di zero.');
      return;
    }

    if (objW <= 0) {
      setError('La larghezza dell\'oggetto deve essere maggiore di zero.');
      return;
    }

    if (numObj < 1) {
      setError('Il numero di oggetti deve essere almeno 1.');
      return;
    }

    if (space < 0) {
      setError('La spaziatura desiderata non può essere negativa.');
      return;
    }

    const totalObjectsWidth = numObj * objW;
    if (totalObjectsWidth > wallW) {
      setError('La larghezza totale degli oggetti non può superare la larghezza del muro.');
      return;
    }

    let resultHtml = '';
    const visualObjects: { start: number; width: number }[] = [];

    // Logic for specified spacing (and more than one object)
    if (space > 0 && numObj > 1) {
      const totalInnerGapsWidth = (numObj - 1) * space;
      const totalOccupiedWidth = totalObjectsWidth + totalInnerGapsWidth;

      if (totalOccupiedWidth > wallW) {
        setError('La larghezza totale degli oggetti e degli spazi desiderati supera la larghezza del muro.');
        return;
      }

      const sideGap = (wallW - totalOccupiedWidth) / 2;

      resultHtml = `Spazio laterale (muro-oggetto):\n`;
      resultHtml += `<span class="text-red-500 font-bold">${formatNumber(sideGap)} cm</span>\n`;
      resultHtml += `Spazio tra oggetti (impostato):\n`;
      resultHtml += `<span class="text-red-500 font-bold">${formatNumber(space)} cm</span>\n\n`;

      let currentPos = sideGap;
      for (let i = 0; i < numObj; i++) {
        const startPos = currentPos;
        const objCenter = startPos + (objW / 2);
        const objEnd = startPos + objW;

        visualObjects.push({ start: startPos, width: objW });

        resultHtml += `Oggetto ${i + 1}:\n`;
        resultHtml += `  Inizio a: ${formatNumber(startPos)} cm\n`;
        resultHtml += `  Centro a: <span class="text-red-500 font-bold">${formatNumber(objCenter)} cm</span>\n`;
        resultHtml += `  Fine a:   ${formatNumber(objEnd)} cm\n\n`;

        currentPos = objEnd + space;
      }
      setVisualData({ wallWidth: wallW, objects: visualObjects, mode: 'desired', sideGap: sideGap, innerGap: space });

    } else { // Original logic for uniform spacing
      if (numObj === 1) {
        const startPos = (wallW - objW) / 2;
        const objCenter = startPos + (objW / 2);
        const objEnd = startPos + objW;

        visualObjects.push({ start: startPos, width: objW });

        resultHtml = `Oggetto 1:\n`;
        resultHtml += `  Inizio a: ${formatNumber(startPos)} cm\n`;
        resultHtml += `  Centro a: <span class="text-red-500 font-bold">${formatNumber(objCenter)} cm</span>\n`;
        resultHtml += `  Fine a:   ${formatNumber(objEnd)} cm\n`;
        
        const sideGapSingle = (wallW - objW) / 2;
        setVisualData({ wallWidth: wallW, objects: visualObjects, mode: 'desired', sideGap: sideGapSingle, innerGap: 0 });

      } else {
        const totalEmptySpace = wallW - totalObjectsWidth;
        const numGaps = numObj + 1;
        const gapSize = totalEmptySpace / numGaps;

        resultHtml = `Dimensione spazio tra oggetti (e tra oggetto e muro):\n`;
        resultHtml += `<span class="text-red-500 font-bold">${formatNumber(gapSize)} cm</span>\n\n`;

        let currentPos = gapSize;
        for (let i = 0; i < numObj; i++) {
          const startPos = currentPos;
          const objCenter = startPos + (objW / 2);
          const objEnd = startPos + objW;

          visualObjects.push({ start: startPos, width: objW });
          
          resultHtml += `Oggetto ${i + 1}:\n`;
          resultHtml += `  Inizio a: ${formatNumber(startPos)} cm\n`;
          resultHtml += `  Centro a: <span class="text-red-500 font-bold">${formatNumber(objCenter)} cm</span>\n`;
          resultHtml += `  Fine a:   ${formatNumber(objEnd)} cm\n\n`;
          
          currentPos = objEnd + gapSize;
        }
        setVisualData({ wallWidth: wallW, objects: visualObjects, mode: 'uniform', gapSize: gapSize });
      }
    }
    setResults(resultHtml.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 md:p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Centratore Oggetti</h1>

        {/* Parameters Section */}
        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="px-2 text-lg font-semibold text-gray-700">Parametri</legend>
          <div className="space-y-4 mt-2">
            <div>
              <label htmlFor="wallWidth" className="block text-sm font-medium text-gray-600 mb-1">
                Larghezza Muro (cm):
              </label>
              <input
                type="number"
                id="wallWidth"
                value={wallWidth}
                onChange={(e) => setWallWidth(e.target.value)}
                onFocus={handleFocus}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="numObjects" className="block text-sm font-medium text-gray-600 mb-1">
                Numero Oggetti:
              </label>
              <input
                type="number"
                id="numObjects"
                value={numObjects}
                onChange={(e) => setNumObjects(e.target.value)}
                onFocus={handleFocus}
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="objectWidth" className="block text-sm font-medium text-gray-600 mb-1">
                Larghezza Oggetto (cm):
              </label>
              <input
                type="number"
                id="objectWidth"
                value={objectWidth}
                onChange={(e) => setObjectWidth(e.target.value)}
                onFocus={handleFocus}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="desiredSpacing" className="block text-sm font-medium text-gray-600 mb-1">
                Spaziatura Desiderata (cm) <span className="font-normal text-gray-500">(opzionale)</span>:
              </label>
              <input
                type="number"
                id="desiredSpacing"
                value={desiredSpacing}
                onChange={(e) => setDesiredSpacing(e.target.value)}
                onFocus={handleFocus}
                step="0.1"
                min="0"
                placeholder="Lascia vuoto per spaziatura uniforme"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>
        </fieldset>
        
        <button
          id="calculateBtn"
          onClick={calculatePositions}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
        >
          Calcola Posizioni
        </button>

        {/* Visualization Section */}
        {visualData && (
          <fieldset className="border border-gray-300 p-4 rounded-md">
             <legend className="px-2 text-lg font-semibold text-gray-700">Visualizzazione</legend>
             <Visualization data={visualData} />
          </fieldset>
        )}

        {/* Results Section */}
        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="px-2 text-lg font-semibold text-gray-700">Risultati Posizionamento</legend>
          {error && (
            <div id="error-message" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md my-2">
              {error}
            </div>
          )}
          {results && (
            <pre
              id="results"
              className="mt-2 bg-gray-50 p-4 rounded-md font-mono text-sm text-gray-800 select-none overflow-y-auto max-h-[300px] whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: results }}
            ></pre>
          )}
          {!error && !results && (
             <div className="mt-2 text-gray-500 text-center py-4">
                I risultati appariranno qui.
            </div>
          )}
        </fieldset>
      </div>
    </div>
  );
};

export default App;
