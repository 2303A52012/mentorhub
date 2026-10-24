import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

export const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error(
      'FATAL: Destructive database seeding is prohibited in production. ' +
      'To force seeding in production, you must explicitly set ALLOW_DESTRUCTIVE_SEED=true with authorized confirmation.'
    );
  }

  console.log('🌱 Seeding PostgreSQL database via Prisma...');

  // 1. Clear existing records in reverse dependency order
  await prisma.taskReview.deleteMany({});
  await prisma.taskSubmission.deleteMany({});
  await prisma.problemProgress.deleteMany({});
  await prisma.menteeTask.deleteMany({});
  await prisma.problem.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.mentorMenteeAssignment.deleteMany({});
  await prisma.batchMentor.deleteMany({});
  await prisma.batchMentee.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.codingProfile.deleteMany({});
  await prisma.menteeProfile.deleteMany({});
  await prisma.mentorProfile.deleteMany({});
  await prisma.menteeAchievement.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});

  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword || seedPassword.length < 8) {
    throw new Error(
      'FATAL: SEED_DEFAULT_PASSWORD environment variable (min 8 characters) must be explicitly configured to run seed scripts.'
    );
  }
  const defaultPasswordHash = await bcrypt.hash(seedPassword, 10);

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Evelyn Reed',
      email: 'admin@sru.edu.in',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      mustChangePassword: true
    }
  });

  const mentorAlan = await prisma.user.create({
    data: {
      name: 'Prof. Alan Turing',
      email: 'mentor.alan@sru.edu.in',
      passwordHash: defaultPasswordHash,
      role: 'MENTOR',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
      mentorProfile: {
        create: {
          department: 'Computer Science & Engineering',
          designation: 'Lead Algorithms Mentor',
          maxMentees: 40,
          bio: 'Algorithms, Competitive Programming, Graph Theory.'
        }
      }
    }
  });

  const mentorGrace = await prisma.user.create({
    data: {
      name: 'Prof. Grace Hopper',
      email: 'mentor.grace@sru.edu.in',
      passwordHash: defaultPasswordHash,
      role: 'MENTOR',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
      mentorProfile: {
        create: {
          department: 'Computer Science & Engineering',
          designation: 'Senior Systems Mentor',
          maxMentees: 40,
          bio: 'Systems Programming, Low-level Optimization, Problem Solving.'
        }
      }
    }
  });

  const alex = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'cse27-042@sru.edu.in',
      passwordHash: defaultPasswordHash,
      role: 'MENTEE',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
      menteeProfile: {
        create: {
          studentId: 'STU2027001',
          rollNumber: 'CSE27-042',
          mobile: '+1 555-0142',
          branch: 'Computer Science & Engineering',
          academicYear: 2027,
          section: 'A',
          skills: ['C++', 'Python', 'Data Structures', 'Dynamic Programming'],
          interests: ['Competitive Programming', 'Distributed Systems']
        }
      },
      codingProfile: {
        create: {
          linkedinUrl: 'https://linkedin.com/in/alexchen-tech',
          githubUrl: 'https://github.com/alexchen-dev',
          leetcodeUrl: 'https://leetcode.com/u/alex_chen_algo/',
          codechefUrl: 'https://www.codechef.com/users/alex_chen',
          codeforcesUrl: 'https://codeforces.com/profile/alex_chen'
        }
      }
    }
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'cse27-088@sru.edu.in',
      passwordHash: defaultPasswordHash,
      role: 'MENTEE',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
      menteeProfile: {
        create: {
          studentId: 'STU2027002',
          rollNumber: 'CSE27-088',
          mobile: '+1 555-0188',
          branch: 'Computer Science & Engineering',
          academicYear: 2027,
          section: 'A',
          skills: ['Java', 'Algorithms', 'SQL'],
          interests: ['Backend Development', 'Algorithmic Problem Solving']
        }
      },
      codingProfile: {
        create: {
          linkedinUrl: 'https://linkedin.com/in/priyasharma-code',
          githubUrl: 'https://github.com/priyasharma',
          leetcodeUrl: 'https://leetcode.com/u/priya_sharma/',
          codechefUrl: '',
          codeforcesUrl: 'https://codeforces.com/profile/priya_s'
        }
      }
    }
  });

  const marcus = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'cse27-112@sru.edu.in',
      passwordHash: defaultPasswordHash,
      role: 'MENTEE',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
      menteeProfile: {
        create: {
          studentId: 'STU2027003',
          rollNumber: 'CSE27-112',
          mobile: '+1 555-0112',
          branch: 'Computer Science & Engineering',
          academicYear: 2027,
          section: 'B',
          skills: ['Python', 'Data Structures'],
          interests: ['Machine Learning', 'Problem Solving']
        }
      },
      codingProfile: {
        create: {
          linkedinUrl: 'https://linkedin.com/in/marcus-vance',
          githubUrl: 'https://github.com/marcusvance',
          leetcodeUrl: 'https://leetcode.com/u/marcus_v/',
          codechefUrl: '',
          codeforcesUrl: ''
        }
      }
    }
  });

  const sofia = await prisma.user.create({
    data: {
      name: 'Sofia Rodriguez',
      email: 'cse27-156@sru.edu.in',
      passwordHash: defaultPasswordHash,
      role: 'MENTEE',
      accountStatus: 'ACTIVE',
      mustChangePassword: false,
      menteeProfile: {
        create: {
          studentId: 'STU2027004',
          rollNumber: 'CSE27-156',
          mobile: '+1 555-0156',
          branch: 'Information Technology',
          academicYear: 2027,
          section: 'B',
          skills: ['C++', 'Algorithms'],
          interests: ['Software Architecture']
        }
      },
      codingProfile: {
        create: {
          linkedinUrl: 'https://linkedin.com/in/sofiarodriguez',
          githubUrl: 'https://github.com/sofiarodriguez',
          leetcodeUrl: 'https://leetcode.com/u/sofia_rodriguez/',
          codechefUrl: '',
          codeforcesUrl: ''
        }
      }
    }
  });

  // 3. Create Batches & Mappings
  const creamBatch = await prisma.batch.create({
    data: {
      name: 'Cream Batch',
      academicYear: 2027,
      description: 'High-performing student training cohort targeting top-tier placement practice.',
      createdById: admin.id,
      mentors: {
        create: [{ mentorId: mentorAlan.id }, { mentorId: mentorGrace.id }]
      },
      mentees: {
        create: [{ menteeId: alex.id }, { menteeId: priya.id }]
      }
    }
  });

  const batchA = await prisma.batch.create({
    data: {
      name: 'Batch A — Core DSA',
      academicYear: 2027,
      description: 'Foundations and intermediate problem solving cohort.',
      createdById: admin.id,
      mentors: {
        create: [{ mentorId: mentorAlan.id }]
      },
      mentees: {
        create: [{ menteeId: marcus.id }]
      }
    }
  });

  const batchB = await prisma.batch.create({
    data: {
      name: 'Batch B — Competitive Track',
      academicYear: 2027,
      description: 'Advanced data structures and contest practice cohort.',
      createdById: admin.id,
      mentors: {
        create: [{ mentorId: mentorGrace.id }]
      },
      mentees: {
        create: [{ menteeId: sofia.id }]
      }
    }
  });

  // 4. Mentor-Mentee Assignments
  await prisma.mentorMenteeAssignment.createMany({
    data: [
      {
        mentorId: mentorAlan.id,
        menteeId: alex.id,
        batchId: creamBatch.id,
        status: 'ACTIVE'
      },
      {
        mentorId: mentorAlan.id,
        menteeId: priya.id,
        batchId: creamBatch.id,
        status: 'ACTIVE'
      },
      {
        mentorId: mentorAlan.id,
        menteeId: marcus.id,
        batchId: batchA.id,
        status: 'ACTIVE'
      },
      {
        mentorId: mentorGrace.id,
        menteeId: sofia.id,
        batchId: batchB.id,
        status: 'ACTIVE'
      }
    ]
  });

  // 5. Tasks & Problems
  const taskWeek1 = await prisma.task.create({
    data: {
      title: 'Array Fundamentals & Binary Search',
      weekNo: 1,
      assignmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      lastDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      instructions:
        'Solve all problems, record your thought process, time complexity analysis, and edge cases in the notes.',
      createdById: mentorAlan.id,
      reviewerId: mentorAlan.id,
      targetType: 'ALL',
      status: 'PUBLISHED',
      problems: {
        create: [
          {
            name: 'Binary Search',
            problemUrl: 'https://leetcode.com/problems/binary-search/',
            platform: 'LEETCODE',
            position: 1
          },
          {
            name: 'Search a 2D Matrix',
            problemUrl: 'https://leetcode.com/problems/search-a-2d-matrix/',
            platform: 'LEETCODE',
            position: 2
          },
          {
            name: 'Find Minimum in Rotated Sorted Array',
            problemUrl:
              'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
            platform: 'LEETCODE',
            position: 3
          }
        ]
      }
    },
    include: { problems: true }
  });

  const taskWeek2 = await prisma.task.create({
    data: {
      title: 'Two Pointers & Sliding Window Mastery',
      weekNo: 2,
      assignmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lastDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      instructions:
        'Focus on identifying shrinking conditions and pointer invariants. Test on edge cases with empty strings and single elements.',
      createdById: mentorAlan.id,
      reviewerId: mentorAlan.id,
      targetType: 'ALL',
      status: 'PUBLISHED',
      problems: {
        create: [
          {
            name: 'Two Sum II - Input Array Is Sorted',
            problemUrl:
              'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/',
            platform: 'LEETCODE',
            position: 1
          },
          {
            name: '3Sum',
            problemUrl: 'https://leetcode.com/problems/3sum/',
            platform: 'LEETCODE',
            position: 2
          },
          {
            name: 'Longest Substring Without Repeating Characters',
            problemUrl:
              'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
            platform: 'LEETCODE',
            position: 3
          },
          {
            name: 'Minimum Window Substring',
            problemUrl: 'https://leetcode.com/problems/minimum-window-substring/',
            platform: 'LEETCODE',
            position: 4
          }
        ]
      }
    },
    include: { problems: true }
  });

  // 6. MenteeTask Week 1 - Alex
  const alexTask1 = await prisma.menteeTask.create({
    data: {
      taskId: taskWeek1.id,
      menteeId: alex.id,
      reviewerId: mentorAlan.id,
      status: 'APPROVED',
      assignedAt: taskWeek1.assignmentDate,
      submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      problemProgress: {
        create: [
          {
            problemId: taskWeek1.problems[0].id,
            notes:
              'Used low and high pointers. mid = low + (high - low)/2 to avoid integer overflow. Time O(log N), Space O(1). Passed all tests.',
            savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
          },
          {
            problemId: taskWeek1.problems[1].id,
            notes:
              'Treated matrix as a virtual 1D array of size m*n. row = mid // n, col = mid % n. Binary search over virtual indices.',
            savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
          },
          {
            problemId: taskWeek1.problems[2].id,
            notes:
              'Compared mid with right element. If nums[mid] > nums[right], minimum must be in right half. Else search left half.',
            savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    }
  });

  const alexSub1 = await prisma.taskSubmission.create({
    data: {
      menteeTaskId: alexTask1.id,
      menteeId: alex.id,
      version: 1,
      problemSnapshot: [
        { problemId: taskWeek1.problems[0].id, notes: 'Binary Search overflow handled' },
        { problemId: taskWeek1.problems[1].id, notes: '2D matrix mapped to 1D' },
        { problemId: taskWeek1.problems[2].id, notes: 'Rotated array binary search' }
      ],
      submittedAt: alexTask1.submittedAt,
      submittedLate: false
    }
  });

  await prisma.taskReview.create({
    data: {
      menteeTaskId: alexTask1.id,
      submissionId: alexSub1.id,
      reviewerId: mentorAlan.id,
      decision: 'APPROVED',
      overallFeedback:
        'Exceptional depth in your complexity analysis and handling of integer overflow. Keep up the high standard!',
      score: 9.5,
      problemReviews: [
        {
          problemId: taskWeek1.problems[0].id,
          feedback: 'Great note on overflow safety with mid calculation.',
          correctionRequired: false
        },
        {
          problemId: taskWeek1.problems[1].id,
          feedback: 'Virtual 1D mapping explanation was concise and clear.',
          correctionRequired: false
        }
      ],
      reviewedAt: alexTask1.approvedAt
    }
  });

  // Priya Week 1
  const priyaTask1 = await prisma.menteeTask.create({
    data: {
      taskId: taskWeek1.id,
      menteeId: priya.id,
      reviewerId: mentorAlan.id,
      status: 'RESUBMISSION_REQUIRED',
      assignedAt: taskWeek1.assignmentDate,
      submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      problemProgress: {
        create: [
          {
            problemId: taskWeek1.problems[0].id,
            notes: 'Classic binary search approach.',
            savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
          },
          {
            problemId: taskWeek1.problems[1].id,
            notes: 'Used row by row search.',
            savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
          },
          {
            problemId: taskWeek1.problems[2].id,
            notes: '',
            savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    }
  });

  const priyaSub1 = await prisma.taskSubmission.create({
    data: {
      menteeTaskId: priyaTask1.id,
      menteeId: priya.id,
      version: 1,
      problemSnapshot: [
        { problemId: taskWeek1.problems[0].id, notes: 'Classic binary search' }
      ],
      submittedAt: priyaTask1.submittedAt,
      submittedLate: false
    }
  });

  await prisma.taskReview.create({
    data: {
      menteeTaskId: priyaTask1.id,
      submissionId: priyaSub1.id,
      reviewerId: mentorAlan.id,
      decision: 'RESUBMISSION_REQUIRED',
      overallFeedback:
        'Please elaborate on the O(log(m*n)) virtual mapping for Problem 2 instead of linear row checks, and provide notes for Problem 3.',
      score: 6.0,
      problemReviews: [
        {
          problemId: taskWeek1.problems[1].id,
          feedback: 'Can you achieve strictly O(log(m*n)) instead of O(m log n)?',
          correctionRequired: true
        }
      ],
      reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  });

  // Week 2 MenteeTasks
  await prisma.menteeTask.create({
    data: {
      taskId: taskWeek2.id,
      menteeId: alex.id,
      reviewerId: mentorAlan.id,
      status: 'IN_PROGRESS',
      assignedAt: taskWeek2.assignmentDate,
      problemProgress: {
        create: [
          {
            problemId: taskWeek2.problems[0].id,
            notes: 'Left and right pointers moving towards center based on sum comparison.',
            savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            problemId: taskWeek2.problems[1].id,
            notes: 'Sorted array first. Fixed one element and ran two sum II on the remainder.',
            savedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    }
  });

  const marcusTask2 = await prisma.menteeTask.create({
    data: {
      taskId: taskWeek2.id,
      menteeId: marcus.id,
      reviewerId: mentorAlan.id,
      status: 'SUBMITTED',
      assignedAt: taskWeek2.assignmentDate,
      submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      problemProgress: {
        create: [
          {
            problemId: taskWeek2.problems[0].id,
            notes: 'Two pointers approach on sorted array.',
            savedAt: new Date(Date.now() - 14 * 60 * 60 * 1000)
          }
        ]
      }
    }
  });

  await prisma.taskSubmission.create({
    data: {
      menteeTaskId: marcusTask2.id,
      menteeId: marcus.id,
      version: 1,
      problemSnapshot: [
        { problemId: taskWeek2.problems[0].id, notes: 'Two pointers approach' }
      ],
      submittedAt: marcusTask2.submittedAt,
      submittedLate: false
    }
  });

  // 7. Achievements
  const ach1 = await prisma.achievement.create({
    data: {
      name: 'First Task Approved',
      code: 'FIRST_TASK_APPROVED',
      description: 'Received first approved task review from your mentor.',
      icon: 'Award',
      points: 100
    }
  });

  const ach2 = await prisma.achievement.create({
    data: {
      name: 'Consistent Learner',
      code: 'CONSISTENT_LEARNER',
      description: 'Completed 3 consecutive weekly coding tasks with approval.',
      icon: 'Flame',
      points: 200
    }
  });

  const ach3 = await prisma.achievement.create({
    data: {
      name: 'On-Time Performer',
      code: 'ON_TIME_PERFORMER',
      description: 'Submitted tasks on time before the deadline.',
      icon: 'Clock',
      points: 150
    }
  });

  await prisma.menteeAchievement.createMany({
    data: [
      { menteeId: alex.id, achievementId: ach1.id },
      { menteeId: alex.id, achievementId: ach3.id }
    ]
  });

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        type: 'TASK_APPROVED',
        title: 'Task Approved: Week 01',
        message: 'Prof. Alan Turing approved your Week 01 submission with score 9.5/10!',
        link: '/mentee/tasks/completed'
      },
      {
        userId: priya.id,
        type: 'RESUBMISSION_REQUESTED',
        title: 'Action Required: Week 01',
        message: 'Prof. Alan Turing requested updates on your Week 01 submission.',
        link: `/mentee/tasks/${priyaTask1.id}`
      },
      {
        userId: mentorAlan.id,
        type: 'TASK_SUBMITTED',
        title: 'Submission Awaiting Review',
        message: 'Marcus Vance submitted Week 02 Two Pointers & Sliding Window.',
        link: `/mentor/task-reviews/${marcusTask2.id}`
      }
    ]
  });

  console.log('✅ PostgreSQL database seeded successfully with Admin, Mentors, Mentees, Batches, Tasks, and Reviews!');
};
