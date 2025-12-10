-- phpMyAdmin SQL Dump
-- version 4.9.11
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 05, 2025 at 02:17 PM
-- Server version: 5.7.44
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bharuchbaps_annkut_new`
--

-- --------------------------------------------------------

--
-- Table structure for table `mandals`
--

CREATE TABLE `mandals` (
  `id` int(11) NOT NULL,
  `xetra_id` int(11) NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mandals`
--

INSERT INTO `mandals` (`id`, `xetra_id`, `code`, `name`, `active`, `created_at`, `updated_at`) VALUES
(1, 1, 'RK', 'Radhakrushna', 1, '2025-08-27 22:05:54', '2025-09-29 21:39:41'),
(2, 1, 'NK', 'Narayankunj', 1, '2025-08-27 22:05:54', '2025-09-29 15:56:19'),
(3, 1, 'MT', 'Maitrinagar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(4, 1, 'SJ', 'Sahjanand', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(5, 1, 'NN', 'Narmadanagar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(6, 1, 'SB', 'Surbhi', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(7, 3, 'VD', 'Vadadla', 1, '2025-08-27 22:05:54', '2025-09-29 20:31:28'),
(8, 1, 'ZD', 'Zadeshwar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(9, 1, 'MN', 'Manasnagar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(10, 1, 'SK', 'Shriniketan', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(11, 1, 'AD', 'Akshardham', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(12, 1, 'PP', 'Pramukh Park', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(13, 1, 'VB', 'Vaibhav', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(14, 1, 'MR', 'Mandir', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(15, 2, 'CH', 'Chakla', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(16, 2, 'SN', 'ShaktiNath', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(17, 2, 'KN', 'Krushna Nagar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(18, 2, 'AL', 'Ali Pura', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(19, 2, 'ML', 'Mangal Tirth', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(20, 2, 'ND', 'Narmada Darshan', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(21, 2, 'AM', 'Ambika Nagar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(22, 2, 'GT', 'Ganesh Township', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(23, 2, 'SR', 'ShreejiKrupa', 1, '2025-08-27 22:05:54', '2025-09-29 15:57:25'),
(24, 2, 'MA', 'Mangalya', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(25, 2, 'CV', 'Chavaj', 1, '2025-08-27 22:05:54', '2025-09-29 15:57:19'),
(26, 2, 'PT', 'Pritamnagar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(27, 2, 'VJ', 'Vejalpur', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(28, 2, 'AS', 'Ashray', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(29, 3, 'MG', 'Mangleshwar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(30, 3, 'ST', 'Shukaltirth', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(31, 3, 'SS', 'Srijisadan', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(32, 3, 'SP', 'Sriji pravesh', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(33, 3, 'NI', 'Nikora', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(34, 3, 'TV', 'Tavra', 1, '2025-08-27 22:05:54', '2025-09-29 15:57:13'),
(35, 3, 'GR', 'Golden Residency', 1, '2025-08-27 22:05:54', '2025-09-29 15:57:09'),
(36, 3, 'MU', 'Mulad', 1, '2025-08-27 22:05:54', '2025-09-29 15:56:38'),
(37, 3, 'GV', 'Govali', 1, '2025-08-27 22:05:54', '2025-09-29 15:56:32'),
(38, 3, 'AG', 'Angareshwar', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(39, 3, 'RS', 'Riddhi Siddhi', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(40, 3, 'UM', 'Umra', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(41, 3, 'KR', 'Karmali', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(42, 3, 'KJ', 'Karjan', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54'),
(43, 3, 'OS', 'Osara', 1, '2025-08-27 22:05:54', '2025-08-27 22:05:54');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `mandals`
--
ALTER TABLE `mandals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_mandal_code` (`code`),
  ADD UNIQUE KEY `uq_mandal_name` (`name`),
  ADD KEY `idx_mandal_xetra` (`xetra_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `mandals`
--
ALTER TABLE `mandals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `mandals`
--
ALTER TABLE `mandals`
  ADD CONSTRAINT `fk_mandal_xetra` FOREIGN KEY (`xetra_id`) REFERENCES `xetra` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
