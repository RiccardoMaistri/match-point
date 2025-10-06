import React from 'react';

const TournamentCard = ({ tournament, onView }) => {
  const { name, format, status, participants, matches } = tournament;

  const totalMatches = matches.length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  const getStatusClass = () => {
    switch (status) {
      case 'in_progress':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      case 'pending':
      default:
        return 'bg-yellow-500';
    }
  };

  const getBackgroundImage = () => {
    // You can customize this logic to have different images based on tournament name, type, etc.
    const images = [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA6w9cKUayns-c3HL0JbLWOgVUY9Cpu-SIMuHfhi9RSZZ-zM6Dx3sDBDinvS-2KeXH7Avs2CdkZUNjOhQTIeO4wee8aQl9I1puicht1xpSIa8GExHfZQV-Q3hr_RPZRymCVPvKDLhqPNnecu-AxZ6waIe6lvKNuXY8sn_8Cro-cWTriGF2KISt2h_yIAMDbCPZKUcQu34psiq3L1gcF5ANGMM7xGt7hugYX-dCyq2NOXzLMU2OWnPQ0NInBvJcKwxnUdURDqJWJa-B3',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAaer9RuBAWB9xJwA7bptipwcslh8ftH3ya6g7EqkvanP7wTU8xMVflHUvHbzm7e9eX6-DtBI3UoQkUYOuUrc28MKnqSJ7DyQyr3z_4F6ATmFo1ysOw3DjiSwwv2GzMtwemBZhiYixIK1hwpnfh-jqccksZLVV-RelAvnt69vZodWAC230-DF26LocZ6rbvWSgBeADm4ho-XEVcxxUjnxwi4DbrASqrAbbnT0D09xomZVjBB5cH2Yh0ikrcogtLTFqFnh9zzmOB5yfZ',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBshV_ulX_dqLqYfN7hEIYbWB17KC5--FpVu78ZTaH85ecLnVdQscGLp4N0HVAkG3-l6z3_7WORXLvEv9kQd4fUDhX8Y_j7o9zk4BhPnRyCf0_BS0zdI5NvUOQZdGrKUINDdP_vGunBfK8YAqiEUTeZ9OFdpEKLqscMMs7hFdoyJ8Fo3pTq717qw25TOSCR3hpeDuyYKWCu0nBIi96eWJgcrkH3sDXsoXl8DwHR3bt7NWNr3wvGiCXVtp_aflX9Vy9nwqDf2cu0OJzV',
    ];
    // Simple logic to pick an image based on tournament name length
    const imageIndex = name.length % images.length;
    return images[imageIndex];
  };


  return (
    <div className="flex flex-col rounded-xl bg-card-background shadow-md overflow-hidden">
      <div
        className="relative h-40 w-full bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: `url("${getBackgroundImage()}")` }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <span className={`absolute top-2 left-2 text-white text-xs font-semibold px-2 py-1 rounded-full ${getStatusClass()}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-primary-text text-lg font-bold leading-tight mb-1">{name}</h3>
        <p className="text-secondary-text text-sm font-normal leading-normal mb-1">
          {format === 'round_robin' ? 'Round Robin + Playoffs' : format}
        </p>
        {status !== 'completed' && (
          <>
            <div className="w-full bg-accent rounded-full h-2.5 mb-3">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-secondary-text text-xs font-normal leading-normal mb-3">{Math.round(progress)}% Complete</p>
          </>
        )}
        <button
          onClick={() => onView(tournament.id)}
          className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-medium leading-normal hover:bg-primary-hover transition-colors duration-150"
        >
          View Tournament
        </button>
      </div>
    </div>
  );
};

export default TournamentCard;
