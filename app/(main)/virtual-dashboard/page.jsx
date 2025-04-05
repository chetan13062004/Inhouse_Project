
import React from 'react'
import AddNewInterview from './_components/AddNewInterview'
import PreviousInterviews from './_components/PreviousInterviews'

const Dashboard = () => {
  return (
    <div className='p-10'>
      <h2 className='text-black-300'>Create and Start AI Interview</h2>

      <div className='grid grid-cols-1 md:grid-cols-3 my-5'>
        <AddNewInterview/>
      </div>

      {/* Add the PreviousInterviews component */}
      <PreviousInterviews />
    </div>
  )
}

export default Dashboard