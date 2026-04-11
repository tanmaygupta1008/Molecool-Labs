import React from 'react';

const TEAM_MEMBERS = [
  {
    name: "Tanmay Gupta",
    title: "Full Stack Web Developer",
    imageUrl: "/profile/Tanmay.jpg",
    id: 1,
  },
  {
    name: "Om Gaikwad",
    title: "ML Engineer and Data Scientist",
    imageUrl: "/profile/Om.jpeg",
    id: 2,
  },
  {
    name: "Vansh Ghori",
    title: "AR Engineer and Simulation Specialist",
    imageUrl: "/profile/Vansh.png",
    id: 3,
  },
  {
    name: "Priyansh Ghori",
    title: "UI/UX Designer",
    imageUrl: "/profile/Priyansh.png",
    id: 4,
  }
];

export default function TeamSection() {
  return (
    <section className="relative w-full max-w-6xl mx-auto px-4 py-32 mt-24">
      <div className="text-center mb-16 relative z-10">
        <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400 mb-4 drop-shadow-lg">
          Meet the Architects
        </h2>
        <p className="text-teal-100/70 text-lg max-w-xl mx-auto">
          The brilliant minds bridging the gap between macroscopic observation and subatomic reality.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {TEAM_MEMBERS.map((member) => {
          return (
            <div
              key={member.id}
              className="group relative flex flex-col items-center p-6 rounded-2xl bg-[#082f49]/40 border border-teal-500/20 backdrop-blur-md hover:bg-[#082f49]/70 transition-all duration-300 hover:-translate-y-2 shadow-2xl hover:shadow-cyan-500/30"
            >
              {/* Holographic glowing ring */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Avatar Placeholder */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-950 to-[#022c22] border-2 border-teal-500/30 mb-4 flex items-center justify-center overflow-hidden group-hover:border-cyan-300 transition-colors">
                <img
                  src={member.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=082f49&color=5eead4&size=150`}
                  alt={`${member.name} profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if the image fails to load
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=082f49&color=5eead4&size=150`;
                  }}
                />
              </div>

              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors text-center">
                {member.name}
              </h3>
              <p className="text-sm text-teal-200/80 font-medium text-center">
                {member.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
