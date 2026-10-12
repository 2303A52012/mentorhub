import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { MenteeProfile } from '../models/MenteeProfile.js';
import { MentorProfile } from '../models/MentorProfile.js';
import { CodingProfile } from '../models/CodingProfile.js';
import { Batch } from '../models/Batch.js';
import { MentorMenteeAssignment } from '../models/MentorMenteeAssignment.js';
import { Task } from '../models/Task.js';
import { MenteeTask } from '../models/MenteeTask.js';
import { TaskSubmission } from '../models/TaskSubmission.js';
import { TaskReview } from '../models/TaskReview.js';
import { Achievement, MenteeAchievement } from '../models/Achievement.js';
import { Notification } from '../models/Notification.js';

export const seedDatabase = async () => {
  console.log('🌱 Seeding initial database data...');

  // 1. Clear existing records to ensure idempotent clean state
  await Promise.all([
    User.deleteMany({}),
    MenteeProfile.deleteMany({}),
    MentorProfile.deleteMany({}),
    CodingProfile.deleteMany({}),
    Batch.deleteMany({}),
    MentorMenteeAssignment.deleteMany({}),
    Task.deleteMany({}),
    MenteeTask.deleteMany({}),
    TaskSubmission.deleteMany({}),
    TaskReview.deleteMany({}),
    Achievement.deleteMany({}),
    MenteeAchievement.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 2. Create Users
  const admin = await User.create({
    name: 'Dr. Evelyn Reed',
    email: 'admin@sru.edu.in',
    passwordHash: defaultPasswordHash,
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    mustChangePassword: false
  });

  const mentorAlan = await User.create({
    name: 'Prof. Alan Turing',
    email: 'mentor.alan@sru.edu.in',
    passwordHash: defaultPasswordHash,
    role: 'MENTOR',
    accountStatus: 'ACTIVE',
    mustChangePassword: false
  });

  const mentorGrace = await User.create({
    name: 'Prof. Grace Hopper',
    email: 'mentor.grace@sru.edu.in',
    passwordHash: defaultPasswordHash,
    role: 'MENTOR',
    accountStatus: 'ACTIVE',
    mustChangePassword: false
  });

  await MentorProfile.create([
    {
      userId: mentorAlan._id,
      department: 'Computer Science & Engineering',
      designation: 'Lead Algorithms Mentor',
      maxMentees: 40,
      bio: 'Algorithms, Competitive Programming, Graph Theory.'
    },
    {
      userId: mentorGrace._id,
      department: 'Computer Science & Engineering',
      designation: 'Senior Systems Mentor',
      maxMentees: 40,
      bio: 'Systems Programming, Low-level Optimization, Problem Solving.'
    }
  ]);

  const alex = await User.create({
    name: 'Alex Chen',
    email: 'cse27-042@sru.edu.in',
    passwordHash: defaultPasswordHash,
    role: 'MENTEE',
    accountStatus: 'ACTIVE',
    mustChangePassword: false
  });

  const priya = await User.create({
    name: 'Priya Sharma',
    email: 'cse27-088@sru.edu.in',
    passwordHash: defaultPasswordHash,
    role: 'MENTEE',
    accountStatus: 'ACTIVE',
    mustChangePassword: false
  });

  const marcus = await User.create({
    name: 'Marcus Vance',
    email: 'cse27-112@sru.edu.in',
    passwordHash: defaultPasswordHash,
    role: 'MENTEE',
    accountStatus: 'ACTIVE',
    mustChangePassword: false
  });

  const sofia = await User.create({
    name: 'Sofia Rodriguez',
    email: 'cse27-156@sru.edu.in',
    passwordHash: defaultPasswordHash,
    role: 'MENTEE',
    accountStatus: 'ACTIVE',
    mustChangePassword: false
  });

  // Mentee Profiles
  await MenteeProfile.create([
    {
      userId: alex._id,
      studentId: 'STU2027001',
      rollNumber: 'CSE27-042',
      mobile: '+1 555-0142',
      branch: 'Computer Science & Engineering',
      academicYear: 2027,
      section: 'A',
      skills: ['C++', 'Python', 'Data Structures', 'Dynamic Programming'],
      interests: ['Competitive Programming', 'Distributed Systems']
    },
    {
      userId: priya._id,
      studentId: 'STU2027002',
      rollNumber: 'CSE27-088',
      mobile: '+1 555-0188',
      branch: 'Computer Science & Engineering',
      academicYear: 2027,
      section: 'A',
      skills: ['Java', 'Algorithms', 'SQL'],
      interests: ['Backend Development', 'Algorithmic Problem Solving']
    },
    {
      userId: marcus._id,
      studentId: 'STU2027003',
      rollNumber: 'CSE27-112',
      mobile: '+1 555-0112',
      branch: 'Computer Science & Engineering',
      academicYear: 2027,
      section: 'B',
      skills: ['Python', 'Data Structures'],
      interests: ['Machine Learning', 'Problem Solving']
    },
    {
      userId: sofia._id,
      studentId: 'STU2027004',
      rollNumber: 'CSE27-156',
      mobile: '+1 555-0156',
      branch: 'Information Technology',
      academicYear: 2027,
      section: 'B',
      skills: ['C++', 'Algorithms'],
      interests: ['Software Architecture']
    }
  ]);

  // Coding Profiles
  await CodingProfile.create([
    {
      menteeId: alex._id,
      linkedinUrl: 'https://linkedin.com/in/alexchen-tech',
      githubUrl: 'https://github.com/alexchen-dev',
      leetcodeUrl: 'https://leetcode.com/u/alex_chen_algo/',
      codechefUrl: 'https://www.codechef.com/users/alex_chen',
      codeforcesUrl: 'https://codeforces.com/profile/alex_chen'
    },
    {
      menteeId: priya._id,
      linkedinUrl: 'https://linkedin.com/in/priyasharma-code',
      githubUrl: 'https://github.com/priyasharma',
      leetcodeUrl: 'https://leetcode.com/u/priya_sharma/',
      codechefUrl: '',
      codeforcesUrl: 'https://codeforces.com/profile/priya_s'
    },
    {
      menteeId: marcus._id,
      linkedinUrl: 'https://linkedin.com/in/marcus-vance',
      githubUrl: 'https://github.com/marcusvance',
      leetcodeUrl: 'https://leetcode.com/u/marcus_v/',
      codechefUrl: '',
      codeforcesUrl: ''
    },
    {
      menteeId: sofia._id,
      linkedinUrl: 'https://linkedin.com/in/sofiarodriguez',
      githubUrl: 'https://github.com/sofiarodriguez',
      leetcodeUrl: 'https://leetcode.com/u/sofia_rodriguez/',
      codechefUrl: '',
      codeforcesUrl: ''
    }
  ]);

  // Batches
  const creamBatch = await Batch.create({
    name: 'Cream Batch',
    academicYear: 2027,
    description: 'High-performing student training cohort targeting top-tier placement practice.',
    mentorIds: [mentorAlan._id, mentorGrace._id],
    menteeIds: [alex._id, priya._id],
    createdBy: admin._id
  });

  const batchA = await Batch.create({
    name: 'Batch A — Core DSA',
    academicYear: 2027,
    description: 'Foundations and intermediate problem solving cohort.',
    mentorIds: [mentorAlan._id],
    menteeIds: [marcus._id],
    createdBy: admin._id
  });

  const batchB = await Batch.create({
    name: 'Batch B — Competitive Track',
    academicYear: 2027,
    description: 'Advanced data structures and contest practice cohort.',
    mentorIds: [mentorGrace._id],
    menteeIds: [sofia._id],
    createdBy: admin._id
  });

  // Mentor-Mentee Assignments
  await MentorMenteeAssignment.create([
    {
      mentorId: mentorAlan._id,
      menteeId: alex._id,
      batchId: creamBatch._id,
      status: 'ACTIVE'
    },
    {
      mentorId: mentorAlan._id,
      menteeId: priya._id,
      batchId: creamBatch._id,
      status: 'ACTIVE'
    },
    {
      mentorId: mentorAlan._id,
      menteeId: marcus._id,
      batchId: batchA._id,
      status: 'ACTIVE'
    },
    {
      mentorId: mentorGrace._id,
      menteeId: sofia._id,
      batchId: batchB._id,
      status: 'ACTIVE'
    }
  ]);

  // Tasks
  const taskWeek1 = await Task.create({
    title: 'Array Fundamentals & Binary Search',
    weekNo: 1,
    assignmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    lastDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    instructions:
      'Solve all problems, record your thought process, time complexity analysis, and edge cases in the notes.',
    problems: [
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
    ],
    createdBy: mentorAlan._id,
    reviewerId: mentorAlan._id,
    targetType: 'ALL',
    status: 'PUBLISHED'
  });

  const taskWeek2 = await Task.create({
    title: 'Two Pointers & Sliding Window Mastery',
    weekNo: 2,
    assignmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    instructions:
      'Focus on identifying shrinking conditions and pointer invariants. Test on edge cases with empty strings and single elements.',
    problems: [
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
    ],
    createdBy: mentorAlan._id,
    reviewerId: mentorAlan._id,
    targetType: 'ALL',
    status: 'PUBLISHED'
  });

  // MenteeTasks for Week 1
  // Alex: APPROVED with score 9/10
  const alexTask1 = await MenteeTask.create({
    taskId: taskWeek1._id,
    menteeId: alex._id,
    reviewerId: mentorAlan._id,
    status: 'APPROVED',
    assignedAt: taskWeek1.assignmentDate,
    submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    problemProgress: [
      {
        problemId: taskWeek1.problems[0]._id,
        notes:
          'Used low and high pointers. mid = low + (high - low)/2 to avoid integer overflow. Time O(log N), Space O(1). Passed all tests.',
        savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek1.problems[1]._id,
        notes:
          'Treated matrix as a virtual 1D array of size m*n. row = mid // n, col = mid % n. Binary search over virtual indices.',
        savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek1.problems[2]._id,
        notes:
          'Compared mid with right element. If nums[mid] > nums[right], minimum must be in right half. Else search left half.',
        savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  const alexSub1 = await TaskSubmission.create({
    menteeTaskId: alexTask1._id,
    menteeId: alex._id,
    version: 1,
    problemSnapshot: alexTask1.problemProgress,
    submittedAt: alexTask1.submittedAt,
    submittedLate: false
  });

  await TaskReview.create({
    menteeTaskId: alexTask1._id,
    submissionId: alexSub1._id,
    reviewerId: mentorAlan._id,
    decision: 'APPROVED',
    overallFeedback:
      'Exceptional depth in your complexity analysis and handling of integer overflow. Keep up the high standard!',
    score: 9.5,
    problemReviews: [
      {
        problemId: taskWeek1.problems[0]._id,
        feedback: 'Great note on overflow safety with mid calculation.',
        correctionRequired: false
      },
      {
        problemId: taskWeek1.problems[1]._id,
        feedback: 'Virtual 1D mapping explanation was concise and clear.',
        correctionRequired: false
      }
    ],
    reviewedAt: alexTask1.approvedAt
  });

  // Priya: RESUBMISSION_REQUIRED for Week 1
  const priyaTask1 = await MenteeTask.create({
    taskId: taskWeek1._id,
    menteeId: priya._id,
    reviewerId: mentorAlan._id,
    status: 'RESUBMISSION_REQUIRED',
    assignedAt: taskWeek1.assignmentDate,
    submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    problemProgress: [
      {
        problemId: taskWeek1.problems[0]._id,
        notes: 'Classic binary search approach.',
        savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek1.problems[1]._id,
        notes: 'Used row by row search.',
        savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek1.problems[2]._id,
        notes: '',
        savedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  const priyaSub1 = await TaskSubmission.create({
    menteeTaskId: priyaTask1._id,
    menteeId: priya._id,
    version: 1,
    problemSnapshot: priyaTask1.problemProgress,
    submittedAt: priyaTask1.submittedAt,
    submittedLate: false
  });

  await TaskReview.create({
    menteeTaskId: priyaTask1._id,
    submissionId: priyaSub1._id,
    reviewerId: mentorAlan._id,
    decision: 'RESUBMISSION_REQUIRED',
    overallFeedback:
      'Please elaborate on the O(log(m*n)) virtual mapping for Problem 2 instead of linear row checks, and provide notes for Problem 3.',
    score: 6.0,
    problemReviews: [
      {
        problemId: taskWeek1.problems[1]._id,
        feedback: 'Can you achieve strictly O(log(m*n)) instead of O(m log n)?',
        correctionRequired: true
      },
      {
        problemId: taskWeek1.problems[2]._id,
        feedback: 'Notes missing for this question.',
        correctionRequired: true
      }
    ],
    reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  });

  // Week 2 MenteeTasks
  // Alex: IN_PROGRESS with 3/4 notes saved
  await MenteeTask.create({
    taskId: taskWeek2._id,
    menteeId: alex._id,
    reviewerId: mentorAlan._id,
    status: 'IN_PROGRESS',
    assignedAt: taskWeek2.assignmentDate,
    problemProgress: [
      {
        problemId: taskWeek2.problems[0]._id,
        notes:
          'Left and right pointers moving towards center based on sum comparison. O(N) time and O(1) space.',
        savedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek2.problems[1]._id,
        notes:
          'Sorted array first. Fixed one element and ran two sum II on the remainder. Remembered to skip duplicates for i, left, and right.',
        savedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek2.problems[2]._id,
        notes:
          'Sliding window with hash map storing last seen index of each character. Left pointer jumps to last seen + 1.',
        savedAt: new Date()
      },
      {
        problemId: taskWeek2.problems[3]._id,
        notes: '',
        savedAt: new Date()
      }
    ]
  });

  // Marcus: SUBMITTED (awaiting review!)
  const marcusTask2 = await MenteeTask.create({
    taskId: taskWeek2._id,
    menteeId: marcus._id,
    reviewerId: mentorAlan._id,
    status: 'SUBMITTED',
    assignedAt: taskWeek2.assignmentDate,
    submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    problemProgress: [
      {
        problemId: taskWeek2.problems[0]._id,
        notes:
          'Two pointers approach on sorted array. Incremented left on small sum, decremented right on big sum.',
        savedAt: new Date(Date.now() - 14 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek2.problems[1]._id,
        notes:
          'Handled duplicate skipping carefully to prevent duplicate triplets.',
        savedAt: new Date(Date.now() - 14 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek2.problems[2]._id,
        notes:
          'Used frequency array/map with window start pointer. Max length tracked dynamically.',
        savedAt: new Date(Date.now() - 13 * 60 * 60 * 1000)
      },
      {
        problemId: taskWeek2.problems[3]._id,
        notes:
          'Frequency map match count. Shrink window whenever condition is met.',
        savedAt: new Date(Date.now() - 13 * 60 * 60 * 1000)
      }
    ]
  });

  await TaskSubmission.create({
    menteeTaskId: marcusTask2._id,
    menteeId: marcus._id,
    version: 1,
    problemSnapshot: marcusTask2.problemProgress,
    submittedAt: marcusTask2.submittedAt,
    submittedLate: false
  });

  // Achievements
  const ach1 = await Achievement.create({
    name: 'First Task Approved',
    code: 'FIRST_TASK_APPROVED',
    description: 'Received first approved task review from your mentor.',
    icon: 'Award',
    points: 100
  });

  const ach2 = await Achievement.create({
    name: 'Consistent Learner',
    code: 'CONSISTENT_LEARNER',
    description: 'Completed 3 consecutive weekly coding tasks with approval.',
    icon: 'Flame',
    points: 200
  });

  const ach3 = await Achievement.create({
    name: 'On-Time Performer',
    code: 'ON_TIME_PERFORMER',
    description: 'Submitted tasks on time before the deadline.',
    icon: 'Clock',
    points: 150
  });

  // Assign achievement to Alex
  await MenteeAchievement.create([
    {
      menteeId: alex._id,
      achievementId: ach1._id
    },
    {
      menteeId: alex._id,
      achievementId: ach3._id
    }
  ]);

  // Notifications
  await Notification.create([
    {
      userId: alex._id,
      type: 'TASK_APPROVED',
      title: 'Task Approved: Week 01',
      message: 'Prof. Alan Turing approved your Week 01 submission with score 9.5/10!',
      link: '/mentee/tasks/completed'
    },
    {
      userId: priya._id,
      type: 'RESUBMISSION_REQUESTED',
      title: 'Action Required: Week 01',
      message: 'Prof. Alan Turing requested updates on your Week 01 submission.',
      link: `/mentee/tasks/${priyaTask1._id}`
    },
    {
      userId: mentorAlan._id,
      type: 'TASK_SUBMITTED',
      title: 'Submission Awaiting Review',
      message: 'Marcus Vance submitted Week 02 Two Pointers & Sliding Window.',
      link: `/mentor/task-reviews/${marcusTask2._id}`
    }
  ]);

  console.log('✅ Demo database seeded successfully with Admin, Mentors, Mentees, Batches, Tasks, and Reviews!');
};
