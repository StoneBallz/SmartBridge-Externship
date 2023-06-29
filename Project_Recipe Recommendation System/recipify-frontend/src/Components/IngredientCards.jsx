import React from 'react'

function IngredientCards({name}) {
  return (
    <div className='bg-white rounded-md h-1/3 flex justify-center items-center'>
        {name}
    </div>
  )
}

export default IngredientCards