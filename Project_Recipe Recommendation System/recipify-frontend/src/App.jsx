import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import IngredientCards from './Components/IngredientCards';

function App() {
  const [count, setCount] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [tags, setTags] = useState(null);

  const secondary = ['healthy', 'seasonal', 'north-american', 'very-low-carbs', 'european', 'italian', 'vegetarian', 'asian', 'indian', 'english', 'portugeuse', 'mexican', 'japanese', 'korean']
  const time = ['1-day-or-more', '60-minutes-or-less', '4-hours-or-less', '30-minutes-or-less', '15-minutes-or-less']
  const difficulty = ['easy', 'for-1-or-2', '3-steps-or-less', 'brown-bag', 'finger-food', 'toddler-friendly', 'one-dish-meal']
  const style = ['barbecue', 'slow-cooker', 'tex-mex', 'refrigerator', 'flat-shapes', 'pizza', 'comfort-food']
  const type = ['frozen-desserts', 'beverages', 'dinner-party', 'meat', 'breakfast', 'brown-bag', 'holiday-event', 'soups', 'shake']

  const [prefSecondary, setPrefSecondary] = useState(secondary[0]);
  const [prefTime, setPrefTime] = useState(time[0]);
  const [prefDifficulty, setPrefDifficulty] = useState(difficulty[0]);
  const [prefStyle, setPrefStyle] = useState(style[0]);
  const [prefType, setPrefType] = useState(type[0]);

  const [output, setOutput] = useState(null);

  useEffect(() => {
    const handleScroll = (event) => {
      const deltaY = event.deltaY;
      const scrollThreshold = 50;

      if (deltaY > scrollThreshold && count < 4) {
        setCount(count + 1);
      } else if (deltaY < -scrollThreshold && count > 0) {
        setCount(count - 1);
      }
    };

    window.addEventListener('wheel', handleScroll);
    return () => {
      window.removeEventListener('wheel', handleScroll);
    };
  }, [count]);

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  const handleFileUpload = (event) => {
    event.preventDefault();
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
  };

  const openPreviewPage = () => {
    const previewWindow = window.open('', '_blank');
    const previewContent = `
      <html>
        <head>
          <title>Preview</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            img {
              max-width: 100%;
              max-height: 80vh;
            }
          </style>
        </head>
        <body>
          ${selectedFiles
            .map((file) => `<img src="${URL.createObjectURL(file)}" alt="Preview" />`)
            .join('')}
        </body>
      </html>
    `;
    previewWindow.document.write(previewContent);
    previewWindow.document.close();
  };

  const moveOn = () => {
    setCount(count + 1)
  }

  const detectIngredients = async () => {
    if (selectedFiles.length === 0) {
      return;
    }
    const formData = new FormData()
    formData.append(
      "file",
      selectedFiles[0],
      selectedFiles[0].name
    )

    const requestOptions = {
      method: 'POST',
      body: formData
    }

    await fetch("http://127.0.0.1:5000/upload", requestOptions)
    .then(response => response.json())
    .then(function(response) {
      setTags(response.tags)
      console.log(tags)
      setCount(count + 1)
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  const generateRecipe = async () => {
    console.log([prefSecondary, prefTime, prefDifficulty, prefStyle, prefType])
    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({
        tags: tags,
        secondary: prefSecondary,
        time: prefTime,
        difficulty: prefDifficulty,
        style: prefStyle,
        type: prefType
      }),
      headers: {
        "Content-Type": "application/json",
      }
    }
    await fetch("http://127.0.0.1:5000/generate", requestOptions)
    .then(response => response.json())
    .then(function(response) {
      setOutput(response.output)
      setCount(count+1)
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

  return (
    <div className='flex flex-row h-screen w-screen px-20 py-16'>
      <div className='flex flex-row h-full w-full text-center'>
        {/* Container 1 */}
        {count === 0 && (
          <motion.div
            className='flex-1 flex flex-col justify-center items-center border-2'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            <p className='text-5xl font-semibold'>Welcome To Recipify</p>
            <p className='p-10'>
              Unleash your culinary adventure with our image-based recipe recommendations. Let our smart system detect
              ingredients and serve up delectable recipes tailored just for you.
            </p>
            <motion.button
              className='preview-button bg-blue-500 text-white px-4 py-2 mt-4 rounded-lg'
              onClick={moveOn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore
          </motion.button>
          </motion.div>
        )}

        {/* Container 2 */}
        {count === 1 && (
          <motion.div
            className='flex-1 flex flex-col justify-center items-center border-2'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            <h1 className='text-5xl font-semibold'>Snap. Discover. Savor.</h1>
            <div
              className='file-dropzone p-8 border-2 border-dashed rounded-lg mt-10'
              onDragOver={(event) => event.preventDefault()}
              onDragEnter={(event) => event.preventDefault()}
              onDragLeave={(event) => event.preventDefault()}
              onDrop={handleFileDrop}
            >
              <label htmlFor='file-input'>
                <input
                  type='file'
                  id='file-input'
                  multiple
                  onChange={handleFileUpload}
                  className='hidden'
                  accept='image/*'
                />
                <motion.div
                  className='flex flex-col items-center justify-center h-full text-center cursor-pointer'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    className='w-12 h-12 text-gray-500 mb-4'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 14.828v2.166a2 2 0 01-2 2H5a2 2 0 01-2-2v-2.166'
                    />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 10V5H7v5M7 10h10' />
                  </svg>
                  <p className='text-gray-500'>
                    {selectedFiles.length > 0 ? selectedFiles[0].name : 'Drag and drop files here or click to browse'}
                  </p>
                </motion.div>
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <div>
              <motion.button
                className='preview-button bg-blue-500 text-white px-4 py-2 mt-4 mr-4 rounded-lg'
                onClick={openPreviewPage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  className='w-5 h-5 mr-2 inline-block'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 14.828v2.166a2 2 0 01-2 2H5a2 2 0 01-2-2v-2.166'
                  />
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 10V5H7v5M7 10h10' />
                </svg>
                Preview
              </motion.button>
              <motion.button
              className='preview-button bg-blue-500 text-white px-4 py-2 mt-4 rounded-lg'
              onClick={detectIngredients}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Detect Ingredients
          </motion.button>
          </div>
            )}
          </motion.div>
        )}

        {/* Container 3 */}
        {count === 2 && (
          <motion.div
            className='flex-1 flex flex-col p-10 justify-center items-center border-2'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            <p className='text-5xl font-semibold mb-10'>Ingredients Available</p>
            <div className='flex-1 bg-gray-300 shadow-lg rounded-lg w-full text-left p-4 grid grid-flow-row grid-cols-4 gap-4'>
              {tags ? 
                tags.map((tag) => (<IngredientCards key={tag} name={tag} />))
                : 
                <p>Nothing is visible</p>}
            </div>
            <motion.button
              className='preview-button bg-blue-500 text-white px-4 py-2 mt-4 rounded-lg'
              onClick={moveOn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Select Preferences
          </motion.button>
          </motion.div>
        )}

      {/* Container 4 */}
      {count === 3 && (
          <motion.div
            className='flex-1 flex flex-col justify-center items-center border-2'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            <p className='text-5xl font-semibold'>User Preferences</p>
            <div className='mt-10 flex flex-row'>
              {/* Secondary Tag */}
              <div className='flex flex-col'>
                <label>Secondary</label>
                <select value={prefSecondary} onChange={e => setPrefSecondary(e.target.value)}>
                  {secondary.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              {/* Time tag */}
              <div className='flex flex-col'>
                <label>Time</label>
                <select value={prefTime} onChange={e => setPrefTime(e.target.value)}>
                  {time.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              {/* Difficulty */}
              <div className='flex flex-col'>
                <label>Difficulty</label>
                <select value={prefDifficulty} onChange={e => setPrefDifficulty(e.target.value)}>
                  {difficulty.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              {/* Style */}
              <div className='flex flex-col'>
                <label>Style</label>
                <select value={prefStyle} onChange={e => setPrefStyle(e.target.value)}>
                  {style.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              {/* Type */}
              <div className='flex flex-col'>
                <label>Type</label>
                <select value={prefType} onChange={e => setPrefType(e.target.value)}>
                  {type.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>
            <motion.button
              className='preview-button bg-blue-500 text-white px-4 py-2 mt-4 rounded-lg'
              onClick={generateRecipe}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Generate Recipe
            </motion.button>
          </motion.div>
        )}

      {/* Container 5 */}
      {count === 4 && (
        <motion.div
          className='flex-1 flex flex-col justify-center items-center border-2'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          <p className='text-5xl font-semibold mb-10'>Generated Recipe</p>
          
            {output ? output : (<p className='p-10'>Generating recipe ...</p>) }
            <motion.button
              className='preview-button bg-blue-500 text-white px-4 py-2 mt-10 rounded-lg'
              onClick={() => setCount(1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Another
          </motion.button>
          
        </motion.div>
      )}
    </div>
    </div>
  );
}

export default App;
